import { useState, useCallback } from 'react';

export interface UseBlogExpansionReturn {
  expandedPostId: string | null;
  isExpanded: (postId: string) => boolean;
  toggleExpansion: (postId: string) => void;
  expandPost: (postId: string) => void;
  collapsePost: () => void;
}

/**
 * Hook for managing blog post expansion state
 * Handles expanding and collapsing blog post cards
 */
export function useBlogExpansion(): UseBlogExpansionReturn {
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);

  const isExpanded = useCallback((postId: string) => expandedPostId === postId, [expandedPostId]);

  const toggleExpansion = useCallback((postId: string) => {
    setExpandedPostId((prev) => (prev === postId ? null : postId));
  }, []);

  const expandPost = useCallback((postId: string) => {
    setExpandedPostId(postId);
  }, []);

  const collapsePost = useCallback(() => {
    setExpandedPostId(null);
  }, []);

  return {
    expandedPostId,
    isExpanded,
    toggleExpansion,
    expandPost,
    collapsePost,
  };
}
