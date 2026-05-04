import { Suspense } from 'react'
import type { Metadata } from 'next'

import NavBar from '../../../components/NavBar'
import Footer from '../../../components/Footer'
import { isLocale, DEFAULT_LOCALE, type Locale } from '../../../lib/payload'

interface Props {
  searchParams: Promise<{ locale?: string }>
}

const COPY = {
  en: {
    title: 'Privacy policy',
    updated: 'Last updated: May 2026',
    intro:
      'Aurora & Ash ("we", "the studio") respects your privacy. This page explains what we collect when you submit an inquiry and how we use it.',
    sections: [
      {
        h: '1. What we collect',
        body:
          'When you submit an inquiry, we collect: your name; an email address and optionally a Telegram handle or phone number; a description of the tattoo you have in mind; placement and approximate size; an optional budget range; and any reference links you choose to share. We also store the timestamp of your submission and your confirmation that you are 18 or older.',
      },
      {
        h: '2. How we use it',
        body:
          'We use this information solely to respond to your inquiry, schedule a consultation, and prepare for your session. We do not sell your data and we do not share it with third parties for marketing.',
      },
      {
        h: '3. Storage and retention',
        body:
          'Inquiries are stored in our secure CMS for as long as we need to manage your booking, and for a reasonable period afterwards for our records. You can request deletion at any time by writing to studio@aurora-ash.com.',
      },
      {
        h: '4. Your rights',
        body:
          'Depending on your jurisdiction (CCPA, GDPR, etc.), you may have the right to access, correct, or delete the information we hold about you. To exercise any of these rights, email studio@aurora-ash.com - we respond within 30 days.',
      },
      {
        h: '5. Cookies and analytics',
        body:
          'This site uses only essential cookies needed to display content. We do not run advertising trackers. If we add analytics in the future, this section will be updated.',
      },
      {
        h: '6. Contact',
        body:
          'Questions about this policy or your data: studio@aurora-ash.com.',
      },
    ],
    disclaimer:
      'This is a working template. Before launch, please replace it with text reviewed by a qualified privacy lawyer for your jurisdiction.',
  },
  ru: {
    title: 'Политика конфиденциальности',
    updated: 'Обновлено: май 2026',
    intro:
      'Aurora & Ash («мы», «студия») уважает вашу приватность. На этой странице описано, какие данные мы собираем, когда вы отправляете заявку, и как мы их используем.',
    sections: [
      {
        h: '1. Какие данные мы собираем',
        body:
          'При отправке заявки мы собираем: ваше имя; email и при желании Telegram или телефон; описание желаемой татуировки; место и примерный размер; опциональный диапазон бюджета; ссылки на референсы, если вы их добавили. Также мы сохраняем время отправки и ваше подтверждение, что вам исполнилось 18 лет.',
      },
      {
        h: '2. Как мы их используем',
        body:
          'Мы используем эти данные только для ответа на вашу заявку, согласования консультации и подготовки к сессии. Мы не продаём ваши данные и не передаём их третьим лицам для маркетинга.',
      },
      {
        h: '3. Хранение',
        body:
          'Заявки хранятся в нашем защищённом CMS столько, сколько необходимо для работы по вашей заявке, и разумный срок после — для наших архивов. Вы можете запросить удаление в любой момент, написав на studio@aurora-ash.com.',
      },
      {
        h: '4. Ваши права',
        body:
          'В зависимости от вашей юрисдикции (CCPA, GDPR и др.) у вас может быть право получить доступ к данным, исправить их или удалить. Чтобы воспользоваться этими правами, напишите на studio@aurora-ash.com — мы ответим в течение 30 дней.',
      },
      {
        h: '5. Cookies и аналитика',
        body:
          'Сайт использует только essential cookies, нужные для отображения контента. Мы не подключаем рекламные трекеры. Если в будущем мы добавим аналитику, этот раздел будет обновлён.',
      },
      {
        h: '6. Контакт',
        body:
          'Вопросы по политике или вашим данным: studio@aurora-ash.com.',
      },
    ],
    disclaimer:
      'Это рабочий шаблон. Перед публичным запуском замените его текстом, согласованным с юристом по вашему праву.',
  },
} as const

export const metadata: Metadata = {
  title: 'Privacy policy - Aurora & Ash',
}

export default async function PrivacyPage({ searchParams }: Props) {
  const sp = await searchParams
  const locale: Locale = isLocale(sp.locale) ? sp.locale : DEFAULT_LOCALE
  const safeLocale: 'en' | 'ru' = locale === 'ru' ? 'ru' : 'en'
  const t = COPY[safeLocale]

  return (
    <>
      <Suspense>
        <NavBar />
      </Suspense>
      <main id="main" className="min-h-screen px-6 md:px-8 pt-32 pb-24 bg-[#121212] text-[#D4AF37]">
        <article className="max-w-3xl mx-auto">
          <p className="label-line text-[#D4AF37]/55 mb-4">{t.updated}</p>
          <h1 className="font-serif text-4xl md:text-5xl tracking-tight mb-10">{t.title}</h1>

          <p className="text-[#D4AF37]/85 text-base md:text-lg leading-relaxed mb-12">
            {t.intro}
          </p>

          <div className="space-y-10">
            {t.sections.map((s) => (
              <section key={s.h}>
                <h2 className="font-serif text-2xl tracking-tight mb-3">{s.h}</h2>
                <p className="text-[#D4AF37]/80 leading-relaxed">{s.body}</p>
              </section>
            ))}
          </div>

          <p className="mt-16 px-4 py-3 border border-[#D4AF37]/20 text-xs text-[#D4AF37]/60 italic leading-relaxed">
            {t.disclaimer}
          </p>
        </article>
      </main>
      <Footer locale={safeLocale} />
    </>
  )
}
