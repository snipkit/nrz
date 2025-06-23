import {
  GitHubIcon,
  LinkedInIcon,
  TwitterIcon,
  DiscordIcon,
} from '@/components/icons/icons.tsx'

export interface Content {
  icon?: (props?: React.SVGProps<SVGSVGElement>) => React.ReactNode
  slug: string
  href: string
}

export interface Section {
  title: string
  contents: Content[]
}

const products: Section = {
  title: 'Products',
  contents: [
    {
      slug: 'Client',
      href: 'https://www.nrz.sh/client',
    },
    {
      slug: 'Serverless Registry',
      href: 'https://www.nrz.sh/serverless-registry',
    },
  ],
}

const resources: Section = {
  title: 'Resources',
  contents: [
    {
      slug: 'Client Docs',
      href: 'https://docs.nrz.sh',
    },
    {
      slug: 'VSR Docs',
      href: 'https://github.com/khulnasoft-lab/vsr',
    },
    {
      slug: 'Pricing',
      href: 'https://www.nrz.sh/serverless-registry',
    },
    {
      slug: 'Brand Kit',
      href: 'https://www.nrz.sh/brand',
    },
  ],
}

const company: Section = {
  title: 'Company',
  contents: [
    {
      slug: 'About',
      href: 'https://www.nrz.sh/company',
    },
    {
      slug: 'Blog',
      href: 'https://blog.nrz.sh/',
    },
    {
      slug: 'Privacy',
      href: 'https://www.nrz.sh/privacy',
    },
    {
      slug: 'Terms',
      href: 'https://www.nrz.sh/terms',
    },
  ],
}

const socials: Section = {
  title: 'Social',
  contents: [
    {
      icon: (props?) => <GitHubIcon {...props} />,
      slug: 'GitHub',
      href: 'https://github.com/khulnasoft-lab',
    },
    {
      icon: (props?) => <LinkedInIcon {...props} />,
      slug: 'LinkedIn',
      href: 'https://www.linkedin.com/company/nrz/',
    },
    {
      icon: (props?) => <TwitterIcon {...props} />,
      slug: 'Twitter',
      href: 'https://x.com/nrz',
    },
    {
      icon: (props?) => <DiscordIcon {...props} />,
      slug: 'Discord',
      href: 'https://discord.gg/nrz',
    },
  ],
}

export const footerContent: Section[] = [
  products,
  resources,
  company,
  socials,
]
