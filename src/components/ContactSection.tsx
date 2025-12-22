import { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Twitter, Instagram, Youtube, Github } from 'lucide-react';
import { ThreadsIcon } from './icons/ThreadsIcon';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import apiClient from '@/lib/apiClient';

interface ContactInfo {
  email: string;
  phone: string;
  address: string;
  socialMedia: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
    github?: string;
    linkedin?: string;
    threads?: string;
  };
}

export const ContactSection = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    email: 'airroad1004@gmail.com',
    phone: '010-8887-9487',
    address: '주소 입력란',
    socialMedia: {
      twitter: 'https://twitter.com/airroad1004',
      instagram: 'https://instagram.com/airroad1004',
      youtube: 'https://youtube.com/@airroad1004',
      github: 'https://github.com/airroad1004-hub',
      linkedin: 'https://linkedin.com/in/airroad1004/',
      threads: 'https://threads.net/@airroad1004',
    },
  });

  const threadsUrl =
    contactInfo?.socialMedia?.threads || contactInfo?.socialMedia?.linkedin || null;

  useEffect(() => {
    const loadContactInfo = async () => {
      try {
        const response = await apiClient.get<{ contact: ContactInfo; footer?: unknown; map?: unknown }>(
          '/api/content/contact'
        );
        if (response.ok && response.data?.contact) {
          setContactInfo(response.data.contact);
        }
        // If API fails or returns no data, keep the default state
      } catch (error) {
        console.error('Failed to load contact info, using defaults:', error);
        // Use default values - no state change needed
      }
    };
    loadContactInfo();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (formData.message.length < 10) {
      toast.error('Message must be at least 10 characters');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      // Cloudflare Worker URL (환경 변수 또는 기본값)
      const contactApiUrl = import.meta.env.VITE_CONTACT_API_URL || 'https://notion-contact-form.vibe-olympics.workers.dev';

      let response;
      if (contactApiUrl.startsWith('http')) {
        // 외부 API (Cloudflare Worker) 사용
        const fetchResponse = await fetch(contactApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
          body: JSON.stringify(formData),
        });
        const data = await fetchResponse.json();
        response = {
          ok: fetchResponse.ok,
          data: data,
          error: data.error,
          message: data.message,
        };
      } else {
        // 내부 API 사용
        response = await apiClient.post<{ messageId: string }>(
          contactApiUrl,
          formData,
          { skipAuth: true }
        );
      }

      if (!response.ok) {
        throw new Error(response.error || response.message || 'Failed to send message');
      }

      toast.success('메시지가 성공적으로 전송되었습니다!');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setSubmitSuccess(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '메시지 전송에 실패했습니다. 다시 시도해 주세요.';
      setSubmitError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-10 md:py-14" aria-labelledby="contact-heading">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 id="contact-heading" className="text-3xl md:text-4xl lg:text-5xl font-black mb-4">
              <span className="gradient-text-animated">Get In Touch</span>
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              질문 & 협업 문의 편하게 연락 주세요.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Contact Form */}
            <div className="bg-card rounded-2xl p-8">
              <form onSubmit={handleSubmit} className="space-y-6" aria-label="Contact form">
                <div>
                  <label htmlFor="contact-name" className="sr-only">
                    Your Name
                  </label>
                  <Input
                    id="contact-name"
                    placeholder="Your Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-12 bg-background focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    required
                    aria-required="true"
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="sr-only">
                    Your Email
                  </label>
                  <Input
                    id="contact-email"
                    type="email"
                    placeholder="Your Email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-12 bg-background focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    required
                    aria-required="true"
                  />
                </div>
                <div>
                  <label htmlFor="contact-subject" className="sr-only">
                    Subject
                  </label>
                  <Input
                    id="contact-subject"
                    placeholder="Subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="h-12 bg-background focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    required
                    aria-required="true"
                  />
                </div>
                <div>
                  <label htmlFor="contact-message" className="sr-only">
                    Your Message
                  </label>
                  <Textarea
                    id="contact-message"
                    placeholder="Your Message"
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="bg-background resize-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    required
                    aria-required="true"
                    minLength={10}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn-hero focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  aria-label={isSubmitting ? 'Sending message' : 'Send message'}
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </Button>
                {submitSuccess && (
                  <p className="text-xs text-green-500" role="status">
                    Message delivered successfully.
                  </p>
                )}
                {submitError && (
                  <p className="text-xs text-red-500" role="alert">
                    {submitError}
                  </p>
                )}
              </form>
            </div>

            {/* Contact Info */}
            <div className="space-y-6 flex flex-col">
              <div className="bg-card rounded-2xl p-8 card-morph glow-pulse">
                <h3 className="text-xl font-bold text-foreground mb-6">Direct Contact</h3>
                <div className="space-y-4" role="list">
                  <div
                    className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors"
                    role="listitem"
                  >
                    <Mail className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                    <a
                      href={`mailto:${contactInfo?.email || 'hello@naija.com'}`}
                      className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                      aria-label={`Email us at ${contactInfo?.email || 'hello@naija.com'}`}
                    >
                      {contactInfo?.email || 'hello@naija.com'}
                    </a>
                  </div>
                  <div
                    className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors"
                    role="listitem"
                  >
                    <Phone className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                    <a
                      href={`tel:${(contactInfo?.phone || '+234 800 NAIJA').replace(/\s/g, '')}`}
                      className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                      aria-label={`Call us at ${contactInfo?.phone || '+234 800 NAIJA'}`}
                    >
                      {contactInfo?.phone || '+234 800 NAIJA'}
                    </a>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground" role="listitem">
                    <MapPin className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                    <span>{contactInfo?.address || 'Lagos, Nigeria'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-2xl p-8 flex-1 flex flex-col justify-center">
                <h3 className="text-xl font-bold text-foreground mb-6">Follow Us</h3>
                <div className="flex flex-wrap gap-1.5 md:gap-2.5" role="list" aria-label="Social media links">
                  {contactInfo?.socialMedia?.twitter && (
                    <a
                      href={contactInfo.socialMedia.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center text-[#1DA1F2] hover:text-primary hover:scale-110 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                      aria-label="Follow us on Twitter"
                      role="listitem"
                    >
                      <Twitter className="h-5 w-5 md:h-6 md:w-6" aria-hidden="true" />
                    </a>
                  )}
                  {contactInfo?.socialMedia?.instagram && (
                    <a
                      href={contactInfo.socialMedia.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center text-[#E4405F] hover:text-primary hover:scale-110 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                      aria-label="Follow us on Instagram"
                      role="listitem"
                    >
                      <Instagram className="h-5 w-5 md:h-6 md:w-6" aria-hidden="true" />
                    </a>
                  )}
                  {contactInfo?.socialMedia?.youtube && (
                    <a
                      href={contactInfo.socialMedia.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center text-[#FF0000] hover:text-primary hover:scale-110 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                      aria-label="Follow us on YouTube"
                      role="listitem"
                    >
                      <Youtube className="h-5 w-5 md:h-6 md:w-6" aria-hidden="true" />
                    </a>
                  )}
                  {contactInfo?.socialMedia?.github && (
                    <a
                      href={contactInfo.socialMedia.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center text-foreground hover:text-primary hover:scale-110 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                      aria-label="Follow us on GitHub"
                      role="listitem"
                    >
                      <Github className="h-5 w-5 md:h-6 md:w-6" aria-hidden="true" />
                    </a>
                  )}
                  {threadsUrl && (
                    <a
                      href={threadsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center text-foreground hover:text-primary hover:scale-110 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                      aria-label="Follow us on Threads"
                      role="listitem"
                    >
                      <ThreadsIcon className="h-5 w-5 md:h-6 md:w-6" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
