"use client";

import {
  ArrowUpRight,
  Award,
  Briefcase,
  ExternalLink,
  GithubIcon,
  Globe,
  GraduationCap,
  Layers,
  LinkedinIcon,
  Mail,
  MapPin,
  Phone,
  User,
  Zap,
} from "lucide-react";
import type React from "react";
import { useMemo } from "react";
import { ShareBar } from "@/components/ShareBar";
import { type ContactLinkType, getContactLinks } from "@/lib/templates/contact-links";
import {
  flattenSkills,
  formatDateRange,
  formatShortDate,
  formatYear,
  getInitials,
} from "@/lib/templates/helpers";
import type { Project } from "@/lib/types/database";
import type { TemplateProps } from "@/lib/types/template";

const FONT_URL =
  "https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&family=IBM+Plex+Sans:wght@300;400;500&display=swap";

const glassIconMap: Partial<
  Record<ContactLinkType, React.ComponentType<{ size: number; className?: string }>>
> = {
  github: GithubIcon,
  linkedin: LinkedinIcon,
  email: Mail,
  phone: Phone,
  website: Globe,
};

const NAV_SECTIONS = [
  { id: "about", label: "About", icon: User },
  { id: "experience", label: "Experience", icon: Briefcase },
  { id: "skills", label: "Skills", icon: Zap },
  { id: "projects", label: "Projects", icon: Layers },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "contact", label: "Contact", icon: Mail },
] as const;

const GlassMorphic: React.FC<TemplateProps> = ({ content, profile }) => {
  const flatSkills = content.skills ? flattenSkills(content.skills) : [];
  const contactLinks = getContactLinks(content.contact);

  const availableNavSections = useMemo(
    () =>
      NAV_SECTIONS.filter((section) => {
        switch (section.id) {
          case "about":
            return true;
          case "experience":
            return content.experience && content.experience.length > 0;
          case "skills":
            return flatSkills.length > 0;
          case "projects":
            return content.projects && content.projects.length > 0;
          case "education":
            return (
              (content.education && content.education.length > 0) ||
              (content.certifications && content.certifications.length > 0)
            );
          case "contact":
            return !!content.contact.email;
          default:
            return false;
        }
      }),
    [
      content.experience,
      content.projects,
      content.education,
      content.certifications,
      content.contact.email,
      flatSkills.length,
    ],
  );

  return (
    <>
      {/* Font preloading */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href={FONT_URL} rel="stylesheet" />

      <style>{`
        .font-display-gm { font-family: 'Outfit', sans-serif; }
        .font-body-gm { font-family: 'IBM Plex Sans', sans-serif; }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      <div
        className="min-h-screen font-body-gm text-[#CBD5E1] relative overflow-x-hidden selection:bg-[#A78BFA]/30 selection:text-white"
        style={{ backgroundColor: "#0F172A" }}
      >
        {/* Static gradient mesh background */}
        <div className="fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
          {/* Violet-tinted radial — top-left */}
          <div
            className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px]"
            style={{
              background: "radial-gradient(circle, rgba(167,139,250,0.12) 0%, transparent 70%)",
              filter: "blur(120px)",
            }}
          />
          {/* Amber-tinted radial — bottom-right */}
          <div
            className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px]"
            style={{
              background: "radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)",
              filter: "blur(100px)",
            }}
          />
          {/* Subtle violet center wash */}
          <div
            className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px]"
            style={{
              background: "radial-gradient(circle, rgba(167,139,250,0.05) 0%, transparent 60%)",
              filter: "blur(80px)",
            }}
          />

          {/* Grain overlay */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
            }}
          />
        </div>

        {/* Sticky horizontal pill navigation — desktop */}
        <nav
          aria-label="Section navigation"
          className="sticky top-0 z-50 hidden md:flex justify-center py-4 backdrop-blur-xl"
          style={{ backgroundColor: "rgba(15,23,42,0.8)" }}
        >
          <div className="flex items-center gap-2">
            {availableNavSections.map((section) => {
              const Icon = section.icon;
              return (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] border border-white/[0.08] text-[#CBD5E1]/60 hover:text-[#A78BFA] hover:bg-[#A78BFA]/10 hover:border-[#A78BFA]/30 transition-colors duration-200"
                >
                  <Icon size={14} className="shrink-0" aria-hidden="true" />
                  <span className="text-xs font-display-gm font-semibold">{section.label}</span>
                </a>
              );
            })}
          </div>
        </nav>

        {/* Bottom bar navigation — mobile */}
        <nav
          aria-label="Section navigation"
          className="fixed bottom-0 left-0 right-0 z-50 md:hidden backdrop-blur-xl border-t border-white/[0.08] pb-[env(safe-area-inset-bottom)]"
          style={{ backgroundColor: "rgba(15,23,42,0.9)" }}
        >
          <div className="flex items-center justify-around py-2 px-1">
            {availableNavSections.slice(0, 5).map((section) => {
              const Icon = section.icon;
              return (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="flex flex-col items-center gap-0.5 px-2 py-1.5 text-[#CBD5E1]/50 hover:text-[#A78BFA] transition-colors"
                >
                  <Icon size={18} aria-hidden="true" />
                  <span className="text-[9px] font-display-gm">{section.label}</span>
                </a>
              );
            })}
          </div>
        </nav>

        {/* Main content area */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-12 md:py-20 pb-24 md:pb-20">
          <main className="space-y-6">
            {/* Hero Section */}
            <section
              id="about"
              className="rounded-3xl backdrop-blur-xl border border-white/[0.10] p-8 md:p-12"
              style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
            >
              <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Avatar */}
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={`${content.full_name}'s avatar`}
                    className="w-24 h-24 rounded-2xl object-cover border border-white/[0.12] shrink-0"
                  />
                ) : (
                  <div
                    className="w-24 h-24 rounded-2xl flex items-center justify-center border border-white/[0.12] shrink-0 font-display-gm text-2xl font-bold"
                    style={{
                      backgroundColor: "rgba(167,139,250,0.1)",
                      color: "#A78BFA",
                    }}
                  >
                    {getInitials(content.full_name)}
                  </div>
                )}

                <div className="flex-1 space-y-6">
                  {/* Status badge */}
                  <div
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#A78BFA]/20"
                    style={{ backgroundColor: "rgba(167,139,250,0.08)" }}
                  >
                    <span className="relative flex h-2 w-2">
                      <span
                        className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                        style={{ backgroundColor: "#A78BFA" }}
                      />
                      <span
                        className="relative inline-flex rounded-full h-2 w-2"
                        style={{ backgroundColor: "#A78BFA" }}
                      />
                    </span>
                    <span
                      className="text-[10px] font-display-gm font-semibold uppercase tracking-widest"
                      style={{ color: "#A78BFA" }}
                    >
                      Available for work
                    </span>
                  </div>

                  <div className="space-y-3">
                    <h1
                      className="text-4xl md:text-6xl font-display-gm font-bold tracking-tight leading-[1.1]"
                      style={{ color: "#F1F5F9" }}
                    >
                      {content.full_name}
                    </h1>
                    {content.headline && (
                      <p
                        className="text-lg font-display-gm font-semibold"
                        style={{ color: "#A78BFA" }}
                      >
                        {content.headline}
                      </p>
                    )}
                    <p className="text-base font-body-gm font-light leading-relaxed max-w-2xl text-[#CBD5E1]">
                      {content.summary}
                    </p>
                  </div>

                  {/* Location */}
                  {content.contact.location && (
                    <div className="flex items-center gap-2 text-[#CBD5E1]/60">
                      <MapPin size={14} aria-hidden="true" />
                      <span className="text-sm font-body-gm">{content.contact.location}</span>
                    </div>
                  )}

                  {/* Contact links */}
                  <div className="flex flex-wrap gap-3">
                    {contactLinks
                      .filter((link) => link.type !== "location")
                      .map((link) => {
                        const IconComponent = glassIconMap[link.type];
                        const isBehance = link.type === "behance";
                        const isDribbble = link.type === "dribbble";

                        if (isBehance || isDribbble) {
                          const color = isBehance ? "#1769FF" : "#EA4C89";
                          const text = isBehance ? "Be" : "Dr";
                          return (
                            <a
                              key={link.type}
                              href={link.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group flex items-center gap-2 px-4 py-2 backdrop-blur-sm border rounded-xl transition-colors duration-300"
                              style={{
                                backgroundColor: `${color}10`,
                                borderColor: `${color}33`,
                              }}
                            >
                              <span className="text-sm font-bold" style={{ color }}>
                                {text}
                              </span>
                              <span className="text-sm font-medium text-[#CBD5E1]/60 group-hover:text-white transition-colors">
                                {link.label}
                              </span>
                            </a>
                          );
                        }

                        return (
                          <a
                            key={link.type}
                            href={link.href}
                            target={link.isExternal ? "_blank" : undefined}
                            rel="noopener noreferrer"
                            className="group flex items-center gap-2 px-4 py-2 bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.12] hover:border-[#A78BFA]/30 rounded-xl backdrop-blur-sm transition-colors duration-300"
                          >
                            {IconComponent && (
                              <IconComponent
                                size={16}
                                className="text-[#CBD5E1]/60 group-hover:text-[#A78BFA] transition-colors"
                                aria-hidden="true"
                              />
                            )}
                            <span className="text-sm font-medium text-[#CBD5E1]/60 group-hover:text-white transition-colors">
                              {link.label}
                            </span>
                          </a>
                        );
                      })}
                  </div>

                  {/* Share bar */}
                  <div className="opacity-60 hover:opacity-100 transition-opacity">
                    <ShareBar
                      handle={profile.handle}
                      title={`${content.full_name}'s Portfolio`}
                      name={content.full_name}
                      variant="glass-morphic"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Experience — vertical timeline */}
            {content.experience && content.experience.length > 0 && (
              <section
                id="experience"
                className="rounded-3xl backdrop-blur-xl border border-white/[0.10] p-8 md:p-12"
                style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
              >
                <h2
                  className="text-2xl font-display-gm font-bold mb-8 flex items-center gap-3"
                  style={{ color: "#F1F5F9" }}
                >
                  <Briefcase className="w-5 h-5" style={{ color: "#A78BFA" }} aria-hidden="true" />
                  Experience
                </h2>

                <div className="border-l-2 border-[#A78BFA]/30 space-y-6 ml-2">
                  {content.experience.map((job, index) => (
                    <div key={index} className="relative pl-6">
                      {/* Timeline dot */}
                      <div
                        className="absolute -left-[7px] top-2 w-3 h-3 rounded-full border-2"
                        style={{
                          backgroundColor: "#0F172A",
                          borderColor: "#A78BFA",
                        }}
                        aria-hidden="true"
                      />

                      <div className="rounded-2xl bg-white/[0.05] border border-white/[0.08] backdrop-blur-md p-6 hover:border-[#A78BFA]/20 transition-colors duration-300">
                        <div className="mb-3">
                          <span
                            className="text-[10px] font-display-gm font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full border inline-block"
                            style={{
                              color: "#A78BFA",
                              borderColor: "rgba(167,139,250,0.2)",
                              backgroundColor: "rgba(167,139,250,0.08)",
                            }}
                          >
                            {formatDateRange(job.start_date, job.end_date)}
                          </span>
                        </div>

                        <h3
                          className="text-lg font-display-gm font-bold mb-1"
                          style={{ color: "#F1F5F9" }}
                        >
                          {job.title}
                        </h3>
                        <p
                          className="text-sm font-body-gm font-medium mb-4"
                          style={{ color: "#A78BFA", opacity: 0.7 }}
                        >
                          {job.company}
                          {job.location && (
                            <span className="text-[#CBD5E1]/40"> &middot; {job.location}</span>
                          )}
                        </p>

                        {job.description && (
                          <p className="text-sm font-body-gm font-light leading-relaxed text-[#CBD5E1]/70 mb-4">
                            {job.description}
                          </p>
                        )}

                        {job.highlights && job.highlights.length > 0 && (
                          <ul className="space-y-1.5">
                            {job.highlights.map((highlight, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-2 text-xs font-body-gm text-[#CBD5E1]/60"
                              >
                                <span
                                  className="mt-1.5 w-1 h-1 rounded-full shrink-0"
                                  style={{ backgroundColor: "#A78BFA" }}
                                  aria-hidden="true"
                                />
                                <span>{highlight}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Skills — uniform chip cloud */}
            {flatSkills.length > 0 && (
              <section
                id="skills"
                className="rounded-3xl backdrop-blur-xl border border-white/[0.10] p-8 md:p-12"
                style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
              >
                <h2
                  className="text-2xl font-display-gm font-bold mb-8 flex items-center gap-3"
                  style={{ color: "#F1F5F9" }}
                >
                  <Zap className="w-5 h-5" style={{ color: "#A78BFA" }} aria-hidden="true" />
                  Skills &amp; Technologies
                </h2>

                <div className="flex flex-wrap gap-3 justify-center">
                  {flatSkills.map((skill) => (
                    <span
                      key={skill}
                      className="bg-white/[0.06] border border-white/[0.10] px-4 py-2 rounded-full text-sm font-body-gm hover:bg-[#A78BFA]/10 hover:border-[#A78BFA]/30 hover:text-white transition-all duration-300 cursor-default"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Projects — 2-col grid */}
            {content.projects && content.projects.length > 0 && (
              <section
                id="projects"
                className="rounded-3xl backdrop-blur-xl border border-white/[0.10] p-8 md:p-12"
                style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
              >
                <h2
                  className="text-2xl font-display-gm font-bold mb-8 flex items-center gap-3"
                  style={{ color: "#F1F5F9" }}
                >
                  <Layers className="w-5 h-5" style={{ color: "#A78BFA" }} aria-hidden="true" />
                  Selected Projects
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {content.projects.map((project: Project, i: number) => (
                    <div
                      key={i}
                      className="group relative rounded-2xl bg-white/[0.06] border border-white/[0.08] backdrop-blur-md overflow-hidden hover:border-transparent transition-colors duration-300"
                    >
                      {/* Gradient bottom border on hover */}
                      <div
                        className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{
                          background: "linear-gradient(to right, #A78BFA, #F59E0B)",
                        }}
                        aria-hidden="true"
                      />

                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="h-10 w-10 rounded-xl flex items-center justify-center font-display-gm font-bold text-sm border border-white/[0.08]"
                              style={{
                                background:
                                  "linear-gradient(135deg, rgba(167,139,250,0.15), rgba(245,158,11,0.15))",
                              }}
                            >
                              <span style={{ color: "#A78BFA" }}>{project.title.charAt(0)}</span>
                            </div>
                            <div>
                              <h3
                                className="text-lg font-display-gm font-bold group-hover:text-[#A78BFA] transition-colors"
                                style={{ color: "#F1F5F9" }}
                              >
                                {project.title}
                              </h3>
                              {project.year && (
                                <span className="text-xs font-body-gm text-[#CBD5E1]/40">
                                  {project.year}
                                </span>
                              )}
                            </div>
                          </div>
                          {project.url && (
                            <a
                              href={project.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Visit ${project.title}`}
                              className="text-[#CBD5E1]/40 hover:text-[#A78BFA] transition-colors"
                            >
                              <ArrowUpRight size={18} aria-hidden="true" />
                            </a>
                          )}
                        </div>

                        <p className="text-sm font-body-gm font-light leading-relaxed text-[#CBD5E1]/70 mb-6">
                          {project.description}
                        </p>

                        {project.technologies && (
                          <div className="flex flex-wrap gap-2 pt-4 border-t border-white/[0.06]">
                            {project.technologies.slice(0, 5).map((tech) => (
                              <span
                                key={tech}
                                className="text-[10px] font-display-gm font-semibold uppercase tracking-wider text-[#CBD5E1]/40 group-hover:text-[#A78BFA]/60 transition-colors"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Education & Certifications */}
            {((content.education && content.education.length > 0) ||
              (content.certifications && content.certifications.length > 0)) && (
              <section
                id="education"
                className="rounded-3xl backdrop-blur-xl border border-white/[0.10] p-8 md:p-12"
                style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {/* Education */}
                  {content.education && content.education.length > 0 && (
                    <div>
                      <h3
                        className="flex items-center gap-2 text-lg font-display-gm font-bold mb-6"
                        style={{ color: "#F1F5F9" }}
                      >
                        <GraduationCap
                          className="w-4 h-4"
                          style={{ color: "#A78BFA" }}
                          aria-hidden="true"
                        />
                        Education
                      </h3>
                      <div className="space-y-5">
                        {content.education.map((edu, idx) => (
                          <div key={idx} className="relative pl-4 border-l-2 border-[#A78BFA]/30">
                            <h4
                              className="text-base font-display-gm font-semibold"
                              style={{ color: "#F1F5F9" }}
                            >
                              {edu.institution}
                            </h4>
                            <p className="text-sm font-body-gm text-[#CBD5E1]/70">{edu.degree}</p>
                            <div className="flex justify-between mt-1 text-xs font-body-gm text-[#CBD5E1]/40">
                              {edu.graduation_date && (
                                <span>{formatYear(edu.graduation_date)}</span>
                              )}
                              {edu.gpa && <span>GPA: {edu.gpa}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Certifications */}
                  {content.certifications && content.certifications.length > 0 && (
                    <div>
                      <h3
                        className="flex items-center gap-2 text-lg font-display-gm font-bold mb-6"
                        style={{ color: "#F1F5F9" }}
                      >
                        <Award
                          className="w-4 h-4"
                          style={{ color: "#A78BFA" }}
                          aria-hidden="true"
                        />
                        Certifications
                      </h3>
                      <div className="space-y-3">
                        {content.certifications.map((cert, idx) => (
                          <a
                            key={idx}
                            href={cert.url || "#"}
                            target={cert.url ? "_blank" : undefined}
                            rel="noopener noreferrer"
                            className={`block p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-[#A78BFA]/20 transition-colors ${!cert.url ? "pointer-events-none" : ""}`}
                          >
                            <div className="flex justify-between items-center">
                              <span
                                className="text-sm font-display-gm font-semibold"
                                style={{ color: "#F1F5F9" }}
                              >
                                {cert.name}
                              </span>
                              {cert.url && (
                                <ExternalLink
                                  size={12}
                                  className="text-[#CBD5E1]/40"
                                  aria-hidden="true"
                                />
                              )}
                            </div>
                            <div className="text-xs font-body-gm text-[#CBD5E1]/40 mt-1 flex justify-between">
                              <span>{cert.issuer}</span>
                              {cert.date && <span>{formatShortDate(cert.date)}</span>}
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* CTA Contact Section */}
            {content.contact.email && (
              <section
                id="contact"
                className="rounded-3xl backdrop-blur-xl border border-white/[0.10] p-10 md:p-16 text-center"
                style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
              >
                <h2
                  className="text-3xl md:text-4xl font-display-gm font-bold mb-4"
                  style={{ color: "#F1F5F9" }}
                >
                  Let&apos;s create something extraordinary
                </h2>
                <p className="font-body-gm font-light text-[#CBD5E1]/70 max-w-md mx-auto mb-8 leading-relaxed">
                  Currently open to new opportunities. If you have a project in mind or just want to
                  connect, I'd love to hear from you.
                </p>
                <a
                  href={`mailto:${content.contact.email}`}
                  className="inline-flex items-center gap-2 px-8 py-3 font-display-gm font-semibold rounded-full hover:scale-105 motion-safe:transition-transform text-white"
                  style={{
                    background: "linear-gradient(135deg, #A78BFA, #F59E0B)",
                    boxShadow: "0 8px 30px rgba(167,139,250,0.25)",
                  }}
                >
                  <Mail size={18} aria-hidden="true" />
                  Say Hello
                </a>
              </section>
            )}
          </main>

          {/* Footer */}
          <footer className="text-center pt-16 pb-10 border-t border-white/[0.05] mt-12">
            <p className="text-xs font-body-gm text-[#CBD5E1]/30" suppressHydrationWarning>
              &copy; {new Date().getFullYear()} {content.full_name}. Crafted with precision.
            </p>
          </footer>
        </div>
      </div>
    </>
  );
};

export default GlassMorphic;
