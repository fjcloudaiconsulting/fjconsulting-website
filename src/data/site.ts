/**
 * Single source of truth for site content and company data.
 *
 * Copy lives here rather than inline in components so the owner can edit wording
 * in one file without touching markup. Everything here must be literally true;
 * see the "Nothing on the page is untrue" principle in PRODUCT.md.
 */

export const company = {
  name: 'FJ Cloud & AI Consulting',
  shortName: 'FJ Consulting',
  owner: 'Flamarion Jorge',
  email: 'info@fjconsulting.io',
  kvk: '42010737',
  vat: 'NL005431862B54',
  address: {
    street: 'Baak van Camperduin 42',
    postalCode: '3826 GH',
    city: 'Amersfoort',
    country: 'Netherlands',
    countryCode: 'NL',
  },
} as const;

export const meta = {
  title: 'FJ Cloud & AI Consulting — Cloud, Kubernetes and AI infrastructure',
  description:
    'Independent cloud, Kubernetes and AI-infrastructure consultancy based in Amersfoort, Netherlands. Infrastructure as code, platform engineering, OpenStack, and GPU infrastructure for teams across the EU.',
  locale: 'en',
} as const;

export const nav = [
  { href: '#services', label: 'Services' },
  { href: '#approach', label: 'Approach' },
  { href: '#about', label: 'About' },
  { href: '#contact', label: 'Contact' },
] as const;

export const hero = {
  status: 'Available for engagements',
  headline: 'Cloud, Kubernetes and AI infrastructure, built as code.',
  lede: `I design, build and operate the platforms that production workloads run on. Independent, vendor-neutral, and hands-on from architecture through to the on-call rota.`,
  location: 'Amersfoort, Netherlands · working across the EU',
  primaryCta: { href: '#contact', label: 'Start a conversation' },
  secondaryCta: { href: '#services', label: 'See what I do' },
} as const;

/**
 * Rendered as a dense typographic list, deliberately not a six-card icon grid.
 * `stack` lines carry the specifics that a technical reader is actually
 * scanning for.
 */
export const services = [
  {
    id: 'iac',
    title: 'Infrastructure as Code',
    summary:
      'Reusable modules, GitOps workflows, and state you can reason about. Environments that rebuild from scratch without anyone holding their breath.',
    stack: ['Terraform', 'OpenTofu', 'Pulumi', 'Atlantis'],
  },
  {
    id: 'kubernetes',
    title: 'Kubernetes',
    summary:
      'Cluster design, and the Day-2 work that actually decides whether it holds up: upgrades, autoscaling, observability, and the on-call reality of running it.',
    stack: ['EKS', 'GKE', 'AKS', 'Argo CD', 'Flux', 'Helm'],
  },
  {
    id: 'cloud',
    title: 'Cloud infrastructure',
    summary:
      'Vendor-neutral architecture across the major providers, including the multi-cloud and exit-strategy questions your procurement team will eventually ask.',
    stack: ['AWS', 'GCP', 'Azure'],
  },
  {
    id: 'private-cloud',
    title: 'Private and sovereign cloud',
    summary:
      'OpenStack deployment and operations for teams that need workloads and data to stay on infrastructure they control, for regulatory or commercial reasons.',
    stack: ['OpenStack', 'Ceph', 'KVM', 'MAAS'],
  },
  {
    id: 'ai-infra',
    title: 'AI infrastructure',
    summary:
      'GPU clusters, scheduling, and the storage and networking underneath training and inference. Built so several teams can share the hardware without fighting over it.',
    stack: ['NVIDIA', 'Slurm', 'Kubeflow', 'Ray'],
  },
  {
    id: 'mlops',
    title: 'ML tooling and MLOps',
    summary:
      'Experiment tracking, model registries, and reproducible pipelines, so a result survives the departure of the person who produced it.',
    stack: ['Weights & Biases', 'ClearML', 'MLflow'],
  },
] as const;

/**
 * A real, ordered sequence, which is why it carries numbers. Section headings
 * elsewhere deliberately do not.
 */
export const approach = [
  {
    title: 'Understand the constraint',
    body: 'Before any architecture, the real limit gets named: a compliance boundary, a budget, a migration deadline, a team that has to own this afterwards. Most infrastructure problems are actually constraint problems that were never written down.',
  },
  {
    title: 'Build it as code, from the start',
    body: 'No console clicking that someone reverse-engineers later. Infrastructure is committed, reviewed, and reproducible from the first environment, which is what makes the second and third ones cheap.',
  },
  {
    title: 'Hand it over properly',
    body: 'The engagement is finished when your engineers can change the platform without me. That means documentation, runbooks, and enough pairing that the knowledge is genuinely transferred rather than merely written down.',
  },
] as const;

export const about = {
  heading: 'A one-person consultancy, which is the point.',
  paragraphs: [
    `FJ Cloud & AI Consulting is run by Flamarion Jorge from Amersfoort. You get the person who does the work, not an account manager and a rotating bench.`,
    `Engagements tend to take one of two shapes. Either a team needs senior infrastructure capacity for a defined stretch and I join it, or a platform needs designing and standing up and the team takes it over once it runs. Both end the same way, with infrastructure your engineers understand and can change on their own.`,
    `Independent means no reseller agreements and no partner quotas. When the honest recommendation is the cheaper tool, or no new tool at all, that is the recommendation you get.`,
  ],
} as const;

export const contact = {
  heading: 'Start a conversation',
  lede: 'Tell me what you are building or what is currently breaking. I read every message and reply personally, usually within a working day.',
  /**
   * Phase 1 ships the form UI with delivery stubbed; the Pages Function that
   * posts to Mailgun arrives in Phase 3. Flip this to true when the endpoint at
   * functions/api/contact.ts is live.
   */
  formEnabled: false,
} as const;
