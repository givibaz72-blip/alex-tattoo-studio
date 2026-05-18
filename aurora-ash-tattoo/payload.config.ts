import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { en } from '@payloadcms/translations/languages/en'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'

import {
  anyAuthenticated,
  isAdmin,
  isAdminFieldAccess,
  isAdminOrLinkedArtist,
  isAdminOrOwnerOfMedia,
  isAdminOrOwnerOfWork,
  isAdminOrSelf,
} from './access.ts'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export default buildConfig({
  admin: {
    user: 'users',
    theme: 'dark',
    importMap: { baseDir: path.resolve(dirname) },
    components: {
      beforeNavLinks: ['@/components/admin/ViewSiteLink'],
      afterNavLinks: ['@/components/admin/LogoutButton'],
    },
    livePreview: {
      url: ({ data, collectionConfig }) => {
        const qs = '?preview=1'
        switch (collectionConfig?.slug) {
          case 'artists':
            return SITE_URL + '/portfolio/' + (data?.slug ?? '') + qs
          case 'pages':
            return SITE_URL + '/' + (data?.slug ?? '') + qs
          default:
            return SITE_URL + qs
        }
      },
      breakpoints: [
        { label: 'Mobile', name: 'mobile', width: 375, height: 667 },
        { label: 'Tablet', name: 'tablet', width: 768, height: 1024 },
        { label: 'Desktop', name: 'desktop', width: 1440, height: 900 },
      ],
    },
  },

  i18n: {
    supportedLanguages: { en },
    fallbackLanguage: 'en',
  },

  localization: {
    locales: [
      { label: 'English', code: 'en' },
    ],
    defaultLocale: 'en',
    fallback: true,
  },

  collections: [
    {
      slug: 'users',
      auth: true,
      labels: { singular: 'User', plural: 'Users' },
      admin: {
        useAsTitle: 'email',
        defaultColumns: ['email', 'role', 'linkedArtist'],
        group: 'Settings',
        description: 'Studio admins and artists. Only admins can create accounts.',
      },
      access: {
        create: isAdmin,
        delete: isAdmin,
        read: isAdminOrSelf,
        update: isAdminOrSelf,
        admin: ({ req: { user } }) => Boolean(user),
      },
      fields: [
        {
          name: 'role',
          type: 'select',
          required: true,
          defaultValue: 'admin',
          label: 'Role',
          access: { update: isAdminFieldAccess, create: isAdminFieldAccess },
          options: [
            { label: 'Studio admin', value: 'admin' },
            { label: 'Artist', value: 'artist' },
          ],
        },
        {
          name: 'linkedArtist',
          type: 'relationship',
          relationTo: 'artists',
          label: 'Linked artist profile',
          access: { update: isAdminFieldAccess, create: isAdminFieldAccess },
          admin: {
            condition: (data) => data?.role === 'artist',
            description: 'Profile this user manages. Set by admin only.',
          },
        },
      ],
    },

    {
      slug: 'media',
      labels: { singular: 'Media file', plural: 'Media library' },
      admin: { group: 'Library', defaultColumns: ['filename', 'alt', 'uploadedBy', 'updatedAt'] },
      access: {
        // Public read so the frontend can serve images.
        read: () => true,
        create: anyAuthenticated,
        // Artist can only modify/delete media they uploaded.
        update: isAdminOrOwnerOfMedia,
        delete: isAdminOrOwnerOfMedia,
      },
      hooks: {
        beforeChange: [
          ({ req, data, operation }) => {
            if (operation === 'create' && req.user && !data.uploadedBy) {
              return { ...data, uploadedBy: req.user.id }
            }
            return data
          },
        ],
      },
      upload: {
        staticDir: path.resolve(dirname, 'public/media'),
        mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml'],
        imageSizes: [
          { name: 'thumbnail', width: 400, height: 400, position: 'centre' },
          { name: 'card', width: 800 },
          { name: 'feature', width: 1200 },
          { name: 'hero', width: 1920 },
        ],
      },
      fields: [
        {
          name: 'alt',
          type: 'text',
          localized: true,
          label: 'Alt text',
          admin: { description: 'Short description for screen readers and SEO.' },
        },
        { name: 'credit', type: 'text', label: 'Photo credit' },
        {
          name: 'uploadedBy',
          type: 'relationship',
          relationTo: 'users',
          label: 'Uploaded by',
          admin: {
            position: 'sidebar',
            readOnly: true,
            description: 'Set automatically. Used to scope media access for artists.',
          },
          access: {
            create: isAdminFieldAccess,
            update: isAdminFieldAccess,
          },
        },
      ],
    },

    {
      slug: 'styles',
      labels: { singular: 'Style', plural: 'Tattoo styles' },
      admin: { useAsTitle: 'name', defaultColumns: ['name', 'slug'], group: 'Catalog' },
      access: { read: () => true, create: isAdmin, update: isAdmin, delete: isAdmin },
      hooks: {
        beforeChange: [
          async ({ data, originalDoc }) => {
            if (!data) return data;
            // Generate slug if name exists and (slug is empty or name has changed)
            if (data.name && (!data.slug || !originalDoc || data.name !== originalDoc?.name)) {
              const { generateSlug } = await import('./lib/slug');
              return { ...data, slug: generateSlug(data.name) };
            }
            return data;
          },
        ],
      },
      fields: [
        { name: 'name', type: 'text', required: true, localized: true, label: 'Name' },
        {
          name: 'slug',
          type: 'text',
          required: true,
          unique: true,
          index: true,
          label: 'Slug',
          admin: { description: 'Latin lowercase, e.g. blackwork' },
        },
        { name: 'description', type: 'textarea', localized: true, label: 'Description' },
      ],
    },

    {
      slug: 'artists',
      versions: { drafts: { autosave: { interval: 800 } } },
      labels: { singular: 'Artist', plural: 'Artists' },
      admin: {
        useAsTitle: 'name',
        defaultColumns: ['name', 'role', 'featured', 'updatedAt'],
        group: 'Content',
        description: 'Artist profile shown at /portfolio/[slug]. Remember to Publish, not just Save.',
        livePreview: {
          url: ({ data }) => {
            return SITE_URL + '/portfolio/' + (data?.slug ?? '') + '?preview=1'
          },
        },
      },
      access: {
        read: () => true,
        create: isAdmin,
        update: isAdminOrLinkedArtist,
        delete: isAdmin,
      },
      hooks: {
        beforeChange: [
          async ({ data, originalDoc }) => {
            if (!data) return data;
            // Generate slug if name exists and (slug is empty or name has changed)
            if (data.name && (!data.slug || !originalDoc || data.name !== originalDoc?.name)) {
              const { generateSlug } = await import('./lib/slug');
              return { ...data, slug: generateSlug(data.name) };
            }
            return data;
          },
        ],
      },
      fields: [
        { name: 'name', type: 'text', required: true, label: 'Name' },
        {
          name: 'slug',
          type: 'text',
          required: true,
          unique: true,
          index: true,
          label: 'URL slug',
          admin: { description: 'URL segment for the page address.' },
        },
        {
          name: 'role',
          type: 'text',
          localized: true,
          label: 'Specialty',
          admin: { description: 'e.g. Lead Artist / Blackwork' },
        },
        {
          name: 'shortBio',
          type: 'textarea',
          localized: true,
          label: 'Short bio (for cards)',
        },
        { name: 'longBio', type: 'richText', localized: true, label: 'Full bio' },
        {
          name: 'portrait',
          type: 'upload',
          relationTo: 'media',
          label: 'Portrait',
          admin: { description: 'Strongly recommended; used on home page card.' },
        },
        { name: 'heroImage', type: 'upload', relationTo: 'media', label: 'Cover image' },
        {
          name: 'styles',
          type: 'relationship',
          relationTo: 'styles',
          hasMany: true,
          label: 'Styles',
        },
        {
          name: 'social',
          type: 'group',
          label: 'Social and contact',
          fields: [
            { name: 'instagram', type: 'text', label: 'Instagram' },
            { name: 'tiktok', type: 'text', label: 'TikTok' },
            { name: 'telegram', type: 'text', label: 'Telegram' },
            { name: 'whatsapp', type: 'text', label: 'WhatsApp' },
            { name: 'email', type: 'email', label: 'Email' },
            { name: 'website', type: 'text', label: 'Website' },
          ],
        },
        {
          name: 'availability',
          type: 'select',
          defaultValue: 'open',
          label: 'Booking status',
          options: [
            { label: 'Accepting bookings', value: 'open' },
            { label: 'Waitlist', value: 'waitlist' },
            { label: 'Closed', value: 'closed' },
          ],
        },
        { name: 'featured', type: 'checkbox', defaultValue: true, label: 'Show on home page' },
        { name: 'order', type: 'number', defaultValue: 100, label: 'Display order' },
        {
          name: 'seo',
          type: 'group',
          label: 'SEO',
          admin: { position: 'sidebar' },
          fields: [
            { name: 'title', type: 'text', localized: true, label: 'Page title' },
            { name: 'description', type: 'textarea', localized: true, label: 'Meta description' },
            { name: 'image', type: 'upload', relationTo: 'media', label: 'Share image' },
          ],
        },
      ],
    },

    {
      slug: 'works',
      versions: { drafts: true },
      labels: { singular: 'Work', plural: 'Works' },
      admin: {
        useAsTitle: 'title',
        defaultColumns: ['title', 'artist', 'featured', '_status', 'createdAt'],
        group: 'Content',
        description:
          'Tattoo gallery items. New entries can stay as drafts (no images needed) until photos are attached - once published, they appear on the artist page.',
      },
      access: {
        read: () => true,
        create: anyAuthenticated,
        update: isAdminOrOwnerOfWork,
        delete: isAdminOrOwnerOfWork,
      },
      hooks: {
        beforeChange: [
          async ({ data, originalDoc }) => {
            if (!data) return data;
            // Generate slug if title exists and (slug is empty or title has changed)
            if (data.title && (!data.slug || !originalDoc || data.title !== originalDoc?.title)) {
              const { generateSlug } = await import('./lib/slug');
              return { ...data, slug: generateSlug(data.title) };
            }
            return data;
          },
        ],
      },
      fields: [
        { name: 'title', type: 'text', required: true, localized: true, label: 'Title' },
        {
          name: 'slug',
          type: 'text',
          required: true,
          unique: true,
          index: true,
          label: 'URL slug',
          admin: { description: 'Latin lowercase, e.g. blackwork-rose' },
        },
        {
          name: 'artist',
          type: 'relationship',
          relationTo: 'artists',
          required: true,
          label: 'Artist',
        },
        {
          name: 'images',
          type: 'array',
          label: 'Photos',
          admin: { description: 'Add multiple angles if available. Images are attached separately via seed-images.' },
          fields: [
            { name: 'image', type: 'upload', relationTo: 'media', required: true, label: 'Photo' },
            { name: 'caption', type: 'text', localized: true, label: 'Caption' },
          ],
        },
        { name: 'description', type: 'textarea', localized: true, label: 'Description' },
        {
          name: 'styles',
          type: 'relationship',
          relationTo: 'styles',
          hasMany: true,
          label: 'Styles',
        },
        { name: 'placement', type: 'text', localized: true, label: 'Body placement' },
        { name: 'size', type: 'text', label: 'Size' },
        { name: 'year', type: 'number', label: 'Year', admin: { step: 1 } },
        { name: 'featured', type: 'checkbox', defaultValue: false, label: 'Featured work' },
      ],
    },

    {
      slug: 'pages',
      versions: { drafts: true },
      labels: { singular: 'Page', plural: 'Pages' },
      admin: {
        useAsTitle: 'title',
        defaultColumns: ['title', 'slug', '_status', 'updatedAt'],
        group: 'Content',
        description:
          'Static pages built from blocks. Drag blocks in any order to compose About / FAQ / Privacy / etc.',
      },
      access: { read: () => true, create: isAdmin, update: isAdmin, delete: isAdmin },
      hooks: {
        beforeChange: [
          async ({ data, originalDoc }) => {
            if (!data) return data;
            // Generate slug if title exists and (slug is empty or title has changed)
            if (data.title && (!data.slug || !originalDoc || data.title !== originalDoc?.title)) {
              const { generateSlug } = await import('./lib/slug');
              return { ...data, slug: generateSlug(data.title) };
            }
            return data;
          },
        ],
      },
      fields: [
        { name: 'title', type: 'text', required: true, localized: true, label: 'Title' },
        { name: 'slug', type: 'text', required: true, unique: true, index: true, label: 'URL slug' },
        {
          name: 'blocks',
          type: 'blocks',
          label: 'Page blocks',
          admin: { description: 'Compose the page from a stack of blocks. Drag to reorder.' },
          blocks: [
            // ---------- HERO ----------
            {
              slug: 'hero',
              labels: { singular: 'Hero block', plural: 'Hero blocks' },
              imageAltText: 'Hero',
              fields: [
                { name: 'title', type: 'text', required: true, localized: true, label: 'Heading (h1)' },
                { name: 'subtitle', type: 'text', localized: true, label: 'Subtitle' },
                { name: 'backgroundImage', type: 'upload', relationTo: 'media', label: 'Background image' },
                {
                  name: 'align',
                  type: 'select',
                  defaultValue: 'center',
                  label: 'Text alignment',
                  options: [
                    { label: 'Center', value: 'center' },
                    { label: 'Left', value: 'left' },
                  ],
                },
                {
                  name: 'sectionId',
                  type: 'text',
                  label: 'Section ID (anchor)',
                  admin: {
                    description:
                      'Optional. HTML id used by in-page anchors. Use lowercase latin only, e.g. "home", "studio".',
                  },
                },
              ],
            },

            // ---------- CONTENT (rich text) ----------
            // Inner field is called `body` (not `content`) to avoid a naming
            // collision with the parent block slug `content` in Payload v3.
            // The `editor` option is set explicitly so the Lexical client UI
            // is guaranteed to be wired up inside the block, even if the
            // top-level editor inheritance fails for some reason.
            {
              slug: 'content',
              labels: { singular: 'Content block', plural: 'Content blocks' },
              imageAltText: 'Content',
              fields: [
                {
                  name: 'body',
                  type: 'richText',
                  localized: true,
                  label: 'Body',
                  editor: lexicalEditor({}),
                },
                {
                  name: 'accentBackground',
                  type: 'checkbox',
                  defaultValue: false,
                  label: 'Accent background',
                  admin: { description: 'Use slightly darker background to break up long text walls.' },
                },
                {
                  name: 'sectionId',
                  type: 'text',
                  label: 'Section ID (anchor)',
                  admin: { description: 'Optional anchor used by in-page scroll links.' },
                },
                {
                  name: 'typography',
                  type: 'group',
                  label: 'Typography',
                  admin: { description: 'Override the default editorial style for this block.' },
                  fields: [
                    {
                      name: 'family',
                      type: 'select',
                      defaultValue: 'default',
                      label: 'Font family',
                      options: [
                        { label: 'Default (Playfair + Inter)', value: 'default' },
                        { label: 'Modern Gothic',              value: 'modern-gothic' },
                        { label: 'Minimalist',                 value: 'minimalist' },
                      ],
                    },
                    {
                      name: 'scale',
                      type: 'select',
                      defaultValue: 'base',
                      label: 'Body size',
                      options: [
                        { label: 'Small',  value: 'sm' },
                        { label: 'Base',   value: 'base' },
                        { label: 'Large',  value: 'lg' },
                        { label: 'X-Large', value: 'xl' },
                      ],
                    },
                  ],
                },
              ],
            },

            // ---------- IMAGE FEATURE ----------
            {
              slug: 'imageFeature',
              labels: { singular: 'Image feature', plural: 'Image features' },
              imageAltText: 'Image feature',
              fields: [
                { name: 'image', type: 'upload', relationTo: 'media', required: true, label: 'Image' },
                { name: 'caption', type: 'text', localized: true, label: 'Caption' },
                {
                  name: 'layout',
                  type: 'select',
                  defaultValue: 'content-width',
                  label: 'Layout',
                  options: [
                    { label: 'Content width', value: 'content-width' },
                    { label: 'Full width', value: 'full-width' },
                  ],
                },
                {
                  name: 'sectionId',
                  type: 'text',
                  label: 'Section ID (anchor)',
                  admin: { description: 'Optional anchor used by in-page scroll links.' },
                },
              ],
            },

            // ---------- PARALLAX SECTION ----------
            {
              slug: 'parallax',
              labels: { singular: 'Parallax section', plural: 'Parallax sections' },
              imageAltText: 'Parallax',
              fields: [
                {
                  name: 'backgroundImage',
                  type: 'upload',
                  relationTo: 'media',
                  required: true,
                  label: 'Background image (desktop)',
                  admin: {
                    description:
                      'Used on tablet and desktop (>= 768px). Landscape orientation recommended.',
                  },
                },
                {
                  name: 'mobileImage',
                  type: 'upload',
                  relationTo: 'media',
                  required: false,
                  label: 'Background image (mobile, optional)',
                  admin: {
                    description:
                      'Optional portrait/vertical crop shown on screens < 768px. If empty, the desktop image is reused.',
                  },
                },
                { name: 'title', type: 'text', localized: true, label: 'Title' },
                { name: 'subtitle', type: 'textarea', localized: true, label: 'Subtitle' },
                {
                  name: 'overlayIntensity',
                  type: 'number',
                  defaultValue: 0.55,
                  min: 0,
                  max: 1,
                  label: 'Overlay intensity (0 - 1)',
                  admin: {
                    step: 0.05,
                    description:
                      '0 = image at full brightness. 1 = fully black. 0.5 - 0.6 keeps text legible without losing the image.',
                  },
                },
                {
                  name: 'sectionId',
                  type: 'text',
                  label: 'Section ID (anchor)',
                  admin: {
                    description:
                      'Optional. HTML id used by in-page anchors. Use lowercase latin only, e.g. "story", "process".',
                  },
                },
                {
                  name: 'height',
                  type: 'select',
                  defaultValue: 'screen',
                  label: 'Section height',
                  options: [
                    { label: 'Full screen (100vh)', value: 'screen' },
                    { label: 'Three-quarters (75vh)', value: 'tall' },
                    { label: 'Half (50vh)', value: 'half' },
                  ],
                },
              ],
            },

            // ---------- ACCORDION (FAQ) ----------
            {
              slug: 'accordion',
              labels: { singular: 'Accordion (FAQ)', plural: 'Accordions (FAQ)' },
              imageAltText: 'Accordion',
              fields: [
                { name: 'heading', type: 'text', localized: true, label: 'Section heading (optional)' },
                {
                  name: 'items',
                  type: 'array',
                  required: true,
                  minRows: 1,
                  label: 'Q&A items',
                  fields: [
                    { name: 'question', type: 'text', required: true, localized: true, label: 'Question' },
                    { name: 'answer', type: 'textarea', required: true, localized: true, label: 'Answer' },
                  ],
                },
                {
                  name: 'sectionId',
                  type: 'text',
                  label: 'Section ID (anchor)',
                  admin: { description: 'Optional anchor used by in-page scroll links.' },
                },
              ],
            },

            // ---------- ARTIST GRID ----------
            {
              slug: 'artistGrid',
              labels: { singular: 'Artist grid', plural: 'Artist grids' },
              imageAltText: 'Artist grid',
              fields: [
                { name: 'heading', type: 'text', localized: true, label: 'Section heading (optional)' },
                {
                  name: 'featuredOnly',
                  type: 'checkbox',
                  defaultValue: true,
                  label: 'Featured artists only',
                  admin: { description: 'Untick to show every artist on the studio.' },
                },
                {
                  name: 'sectionId',
                  type: 'text',
                  label: 'Section ID (anchor)',
                  admin: { description: 'Optional anchor used by in-page scroll links.' },
                },
              ],
            },

            // ---------- COLUMNS (multi-column layout) ----------
            {
              slug: 'columns',
              labels: { singular: 'Columns block', plural: 'Columns blocks' },
              imageAltText: 'Columns',
              fields: [
                {
                  name: 'layout',
                  type: 'select',
                  defaultValue: '50_50',
                  label: 'Column layout',
                  options: [
                    { label: 'Two columns · 50 / 50',       value: '50_50' },
                    { label: 'Two columns · 33 / 66',       value: '33_66' },
                    { label: 'Two columns · 66 / 33',       value: '66_33' },
                    { label: 'Three columns · 33 / 33 / 33', value: '33_33_33' },
                  ],
                  admin: {
                    description:
                      'The number of columns is inferred from the layout (two or three). Add a matching number of items below.',
                  },
                },
                {
                  name: 'gap',
                  type: 'select',
                  defaultValue: 'md',
                  label: 'Gap between columns',
                  options: [
                    { label: 'Tight',  value: 'sm' },
                    { label: 'Normal', value: 'md' },
                    { label: 'Wide',   value: 'lg' },
                  ],
                },
                {
                  name: 'items',
                  type: 'array',
                  required: true,
                  minRows: 2,
                  maxRows: 3,
                  label: 'Columns',
                  admin: { description: 'Order matters — first item is the left/top column.' },
                  fields: [
                    {
                      name: 'body',
                      type: 'richText',
                      localized: true,
                      label: 'Body',
                      editor: lexicalEditor({}),
                    },
                    {
                      name: 'image',
                      type: 'upload',
                      relationTo: 'media',
                      label: 'Image (optional, replaces body if set)',
                    },
                    {
                      name: 'imageCaption',
                      type: 'text',
                      localized: true,
                      label: 'Image caption',
                    },
                  ],
                },
                {
                  name: 'sectionId',
                  type: 'text',
                  label: 'Section ID (anchor)',
                  admin: { description: 'Optional anchor used by in-page scroll links.' },
                },
              ],
            },
          ],
        },
        {
          name: 'seo',
          type: 'group',
          label: 'SEO',
          admin: { position: 'sidebar' },
          fields: [
            { name: 'title', type: 'text', localized: true, label: 'Page title' },
            { name: 'description', type: 'textarea', localized: true, label: 'Meta description' },
          ],
        },
      ],
    },

    {
      slug: 'inquiries',
      labels: { singular: 'Inquiry', plural: 'Inquiries' },
      admin: {
        useAsTitle: 'name',
        defaultColumns: ['name', 'email', 'status', 'artist', 'budget', 'createdAt'],
        group: 'Operations',
      },
      access: {
        create: () => true,
        read: isAdminOrOwnerOfWork,
        update: isAdmin,
        delete: isAdmin,
      },
      fields: [
        { name: 'name', type: 'text', required: true, label: 'Client name' },
        { name: 'contact', type: 'text', required: true, label: 'Contact (legacy combined)' },
        // --- NEW: structured contact ---
        { name: 'email', type: 'email', label: 'Email' },
        { name: 'telegram', type: 'text', label: 'Telegram or phone' },
        // --- end new ---
        { name: 'artist', type: 'relationship', relationTo: 'artists', label: 'Requested artist' },
        { name: 'vision', type: 'textarea', label: 'Vision and references' },
        // --- NEW: extra context ---
        {
          name: 'references',
          type: 'textarea',
          label: 'Reference links / notes',
          admin: { description: 'Optional URLs (Pinterest, Instagram, Drive) submitted by the client.' },
        },
        // --- end new ---
        { name: 'placement', type: 'text', label: 'Placement' },
        { name: 'size', type: 'text', label: 'Size' },
        // --- NEW: budget + consents ---
        {
          name: 'budget',
          type: 'select',
          label: 'Budget range',
          options: [
            { label: 'Under $300', value: 'under_300' },
            { label: '$300 – $800', value: '300_800' },
            { label: '$800 – $1500', value: '800_1500' },
            { label: 'Over $1500', value: 'over_1500' },
            { label: 'Not sure yet', value: 'undecided' },
          ],
        },
        {
          name: 'ageConfirmed',
          type: 'checkbox',
          required: true,
          defaultValue: false,
          label: 'Client confirmed 18+',
        },
        {
          name: 'privacyConsent',
          type: 'checkbox',
          required: true,
          defaultValue: false,
          label: 'Client agreed to privacy policy',
        },
        // --- end new ---
        {
          name: 'status',
          type: 'select',
          defaultValue: 'new',
          required: true,
          label: 'Status',
          options: [
            { label: 'New', value: 'new' },
            { label: 'In progress', value: 'contacted' },
            { label: 'Scheduled', value: 'scheduled' },
            { label: 'Done', value: 'done' },
            { label: 'Declined', value: 'declined' },
          ],
        },
        {
          name: 'notes',
          type: 'array',
          label: 'Internal notes',
          admin: { description: 'Internal notes for the team. Client cannot see them.' },
          fields: [{ name: 'text', type: 'textarea', label: 'Note' }],
        },
      ],
    },
  ],

  globals: [
    {
      slug: 'siteSettings',
      label: 'Site Settings',
      admin: {
        group: 'Settings' },
      access: { read: () => true, update: isAdmin },
      fields: [
        { name: 'phone', type: 'text', label: 'Phone' },
        { name: 'email', type: 'text', label: 'Email' },
        { name: 'address', type: 'textarea', localized: true, label: 'Address' },
        { name: 'hours', type: 'text', label: 'Studio Hours', defaultValue: 'Mon-Sun: 12 PM — 8 PM (By Appointment Only)' },
        { name: 'social',
          type: 'group',
          label: 'Social links',
          fields: [
            { name: 'instagram', type: 'text', label: 'Instagram' },
            { name: 'tiktok', type: 'text', label: 'TikTok' },
            { name: 'telegram', type: 'text', label: 'Telegram' },
            { name: 'whatsapp', type: 'text', label: 'WhatsApp' },
          ],
        },
        { name: 'footerLogo', type: 'upload', relationTo: 'media', label: 'Footer logo' },
        { name: 'heroImage', type: 'upload', relationTo: 'media', label: 'Hero image' },
      ],
    },
  ],

  editor: lexicalEditor({}),
  secret: process.env.PAYLOAD_SECRET || 'YOUR_SECRET_HERE',
  db: sqliteAdapter({
    client: { url: process.env.DATABASE_URI || 'file:./payload.db' },
  }),
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
