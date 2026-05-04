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
      url: ({ data, collectionConfig, locale }) => {
        const qs = locale?.code && locale.code !== 'en' ? '?locale=' + locale.code + '&preview=1' : '?preview=1'
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
      { label: 'Russian', code: 'ru' },
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
        mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
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
          async ({ data }) => {
            if (data.name && !data.slug) {
              // Import the slug generation utility
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
          url: ({ data, locale }) => {
            const qs = locale?.code && locale.code !== 'en' ? '?locale=' + locale.code + '&preview=1' : '?preview=1'
            return SITE_URL + '/portfolio/' + (data?.slug ?? '') + qs
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
          async ({ data }) => {
            if (data.name && !data.slug) {
              // Import the slug generation utility
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
          async ({ data }) => {
            if (data.title && !data.slug) {
              // Import the slug generation utility
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
        defaultColumns: ['title', 'slug', 'updatedAt'],
        group: 'Content',
      },
      access: { read: () => true, create: isAdmin, update: isAdmin, delete: isAdmin },
      hooks: {
        beforeChange: [
          async ({ data }) => {
            if (data.title && !data.slug) {
              // Import the slug generation utility
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
        { name: 'content', type: 'richText', localized: true, label: 'Content' },
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
        read: isAdmin,
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
      slug: 'studio',
      label: 'Studio info',
      admin: {
        group: 'Settings' },
      access: { read: () => true, update: isAdmin },
      fields: [
        { name: 'name', type: 'text', defaultValue: 'Aurora & Ash', label: 'Studio name' },
        { name: 'tagline', type: 'text', localized: true, defaultValue: 'WE FEEL IT', label: 'Tagline' },
        { name: 'philosophy', type: 'textarea', localized: true, label: 'Philosophy (legacy)' },
        {
          name: 'about',
          type: 'group',
          label: 'About section (home page)',
          admin: {
            description: 'The "Philosophy" block shown on the home page.',
          },
          fields: [
            {
              name: 'eyebrow',
              type: 'text',
              localized: true,
              defaultValue: 'The Philosophy',
              label: 'Eyebrow / small caption above heading',
            },
            {
              name: 'heading',
              type: 'text',
              localized: true,
              defaultValue: 'A CURATED SPACE FOR PERMANENT ART',
              label: 'Heading',
            },
            {
              name: 'body',
              type: 'textarea',
              localized: true,
              defaultValue:
                'We accept limited bookings per month to ensure every piece receives absolute focus. Our studio operates as a private gallery where skin meets curated vision.',
              label: 'Body text',
            },
            {
              name: 'image',
              type: 'upload',
              relationTo: 'media',
              label: 'Section image',
              admin: { description: 'Optional image shown next to the text.' },
            },
          ],
        },
        { name: 'address', type: 'textarea', localized: true, label: 'Address' },
        { name: 'phone', type: 'text', label: 'Phone' },
        { name: 'email', type: 'email', label: 'Email' },
        { name: 'hours', type: 'textarea', localized: true, label: 'Working hours' },
        {
          name: 'social',
          type: 'group',
          label: 'Studio social',
          fields: [
            { name: 'instagram', type: 'text', label: 'Instagram' },
            { name: 'tiktok', type: 'text', label: 'TikTok' },
            { name: 'telegram', type: 'text', label: 'Telegram' },
            { name: 'whatsapp', type: 'text', label: 'WhatsApp' },
          ],
        },
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
