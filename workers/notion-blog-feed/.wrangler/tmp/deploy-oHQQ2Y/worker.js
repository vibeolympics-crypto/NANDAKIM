var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// worker.js
var NOTION_API_VERSION = "2022-06-28";
var NOTION_API_BASE = "https://api.notion.com/v1";
function getCorsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowedOrigins = (env.ALLOWED_ORIGINS || "http://localhost:5173,http://localhost:3000").split(",").map((o) => o.trim());
  const isAllowed = allowedOrigins.includes(origin) || allowedOrigins.includes("*");
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : allowedOrigins[0],
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400"
  };
}
__name(getCorsHeaders, "getCorsHeaders");
function richTextToPlainText(richTextArray) {
  if (!richTextArray || !Array.isArray(richTextArray)) return "";
  return richTextArray.map((item) => item.plain_text || "").join("");
}
__name(richTextToPlainText, "richTextToPlainText");
function transformNotionPage(page) {
  const properties = page.properties || {};
  let title = "";
  for (const [key, prop] of Object.entries(properties)) {
    if (prop.type === "title") {
      title = richTextToPlainText(prop.title);
      break;
    }
  }
  const summary = properties.Summary?.rich_text ? richTextToPlainText(properties.Summary.rich_text) : properties["AI \uC790\uB3D9 \uC785\uB825"]?.rich_text ? richTextToPlainText(properties["AI \uC790\uB3D9 \uC785\uB825"].rich_text) : properties.Description?.rich_text ? richTextToPlainText(properties.Description.rich_text) : "";
  let date = "";
  if (properties["\uAC8C\uC2DC\uC77C"]?.date?.start) {
    date = properties["\uAC8C\uC2DC\uC77C"].date.start;
  } else if (properties.Date?.date?.start) {
    date = properties.Date.date.start;
  } else if (properties.Created?.created_time) {
    date = properties.Created.created_time.split("T")[0];
  } else if (page.created_time) {
    date = page.created_time.split("T")[0];
  }
  const tags = [];
  if (properties["\uD0DC\uADF8"]?.multi_select) {
    properties["\uD0DC\uADF8"].multi_select.forEach((tag) => tags.push(tag.name));
  } else if (properties.Tags?.multi_select) {
    properties.Tags.multi_select.forEach((tag) => tags.push(tag.name));
  } else if (properties.Category?.select) {
    tags.push(properties.Category.select.name);
  }
  let thumbnail = "";
  if (page.cover) {
    if (page.cover.type === "external") {
      thumbnail = page.cover.external.url;
    } else if (page.cover.type === "file") {
      thumbnail = page.cover.file.url;
    }
  }
  if (properties.Thumbnail?.files?.[0]) {
    const file = properties.Thumbnail.files[0];
    thumbnail = file.external?.url || file.file?.url || thumbnail;
  }
  let url = page.url || "";
  if (properties.URL?.url) {
    url = properties.URL.url;
  } else if (properties.Link?.url) {
    url = properties.Link.url;
  }
  let author = "Won Kim";
  if (properties["\uC0DD\uC131\uC790"]?.people?.[0]?.name) {
    author = properties["\uC0DD\uC131\uC790"].people[0].name;
  } else if (properties.Author?.people?.[0]?.name) {
    author = properties.Author.people[0].name;
  } else if (properties.Author?.rich_text) {
    author = richTextToPlainText(properties.Author.rich_text) || author;
  }
  const status = properties.Status?.select?.name || "Published";
  return {
    id: page.id,
    title: title || "Untitled",
    summary,
    date,
    tags,
    thumbnail,
    url,
    author,
    status
  };
}
__name(transformNotionPage, "transformNotionPage");
async function queryNotionDatabase(env, limit = 10) {
  const response = await fetch(`${NOTION_API_BASE}/databases/${env.NOTION_DATABASE_ID}/query`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.NOTION_API_KEY}`,
      "Notion-Version": NOTION_API_VERSION,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      page_size: limit,
      sorts: [
        {
          property: "\uAC8C\uC2DC\uC77C",
          direction: "descending"
        }
      ]
    })
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Notion API error: ${response.status} - ${errorText}`);
  }
  return response.json();
}
__name(queryNotionDatabase, "queryNotionDatabase");
var worker_default = {
  async fetch(request, env, ctx) {
    const corsHeaders = getCorsHeaders(request, env);
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }
    if (request.method !== "GET") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    try {
      if (!env.NOTION_API_KEY || !env.NOTION_DATABASE_ID) {
        throw new Error("Missing required environment variables: NOTION_API_KEY or NOTION_DATABASE_ID");
      }
      const url = new URL(request.url);
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "10", 10), 50);
      const notionResponse = await queryNotionDatabase(env, limit);
      const posts = (notionResponse.results || []).map(transformNotionPage);
      return new Response(JSON.stringify({
        success: true,
        posts,
        total: posts.length,
        hasMore: notionResponse.has_more || false
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "public, max-age=300",
          // 5분 캐시
          ...corsHeaders
        }
      });
    } catch (error) {
      console.error("Error fetching Notion blog feed:", error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message || "Failed to fetch blog posts",
        posts: []
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          ...corsHeaders
        }
      });
    }
  }
};
export {
  worker_default as default
};
//# sourceMappingURL=worker.js.map
