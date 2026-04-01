'use client'

import styles from './obo-mne.module.css'
import { useText } from '@/lib/sandboxText'

export default function OboMnePage() {
  const t = useText()

  return (
    <div className={styles.page}>

      {/* ── Eyebrow ─────────────────────────────────────────────────────── */}
      <div className={styles.heroContent}>
        <p className={styles.eyebrow}>
          {t('eyebrow', 'Обо мне')}
        </p>
      </div>

      {/* ── Вступление ──────────────────────────────────────────────────── */}
      <section className={styles.content}>
        <p className={styles.lead}>
          {t('lead', 'Опыт работы в крупных банках, историю развития и успеха. Звучит пафосно, но тем не менее:')}
        </p>
      </section>

      {/* ── Что я могу предложить ─────────────────────────────────────── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          {t('title', 'Что я могу предложить')}
        </h2>
        <div className={styles.cardsGrid}>
          <div className={`${styles.card} ${styles.fullWidthCard}`}>
            <p className={styles.cardText}>{t('card.0.text', 'Редизайн банковского приложения и сайта.')}</p>
          </div>
          <div className={`${styles.card} ${styles.fullWidthCard}`}>
            <p className={styles.cardText}>{t('card.1.text', 'Активное внедрение нового функционала и разработка нескольких дополнительных приложений. Это принесло значительный рост бизнес-показателей.')}</p>
          </div>
          <div className={`${styles.card} ${styles.fullWidthCard}`}>
            <p className={styles.cardText}>{t('card.2.text', 'Подъем в рейтинге банковских приложений Markswebb с 17 до 3 места. Подъем рейтинга в апсторах.')}</p>
          </div>
          <div className={`${styles.card} ${styles.fullWidthCard}`}>
            <p className={styles.cardText}>{t('card.3.text', 'Собранная с нуля дизайн-система для приложения и сайта.')}</p>
          </div>
          <div className={`${styles.card} ${styles.fullWidthCard}`}>
            <p className={styles.cardText}>{t('card.4.text', 'И это за 3 года работы команды, в которой было только три дизайнера и только к моменту создания дизайн-системы команда увеличилась до пяти человек.')}</p>
          </div>
        </div>
      </section>

      {/* ── История ─────────────────────────────────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.body}>
          <p>{t('bio.0', 'Всё это удалось сделать в МКБ с 2019 и до середины 2022 года. Ни пандемия, ни удалёнка не повлияли на результаты. Я получил шикарный опыт работы с менеджерами, руководителями направлений и разработчиками. Не просто работа над сценариями и экранами, но и защита своих решений перед руководством и командой.')}</p>
          <p>{t('bio.1', 'К сожалению, банком было принято решение сократить вложения в розничный бизнес и заморозить развитие направления. Руководство команды перешло в Почта Банк, чтобы там повторить сравнимые показатели развития.')}</p>
          <p>{t('bio.2', 'В Почта Банке сделали небольшой редизайн приложения и сайта, успели привести в порядок процессы по работе над дизайном, начали собирать дизайн-систему. Даже немного поднялись в рейтинге Markswebb. Но и в Почта Банке довольно быстро заморозили работы по развитию приложения и сайта в связи с процессом слияния и поглощения.')}</p>
          <p>{t('bio.7', 'Мне очень нравится ощущение развития и роста. Когда есть вызов моим навыкам и когда есть люди, которые вдохновляют расти. Я стал тем, кто я есть благодаря таким командам и людям. Верю, что мы пересечёмся.')}</p>
        </div>
      </section>

      {/* ── Что я ищу ───────────────────────────────────────────────────── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          {t('title.2', 'Что я ищу')}
        </h2>
        <p className={styles.sectionLead}>
          {t('lead.1', 'Мне всегда очень везло на работодателей. Всегда вокруг была отличная команда, с кем легко общаться и у кого можно чему-то научиться. Для меня очень важна атмосфера и очевидные перспективы развития. Из пожеланий:')}
        </p>
        <div className={styles.cardsGrid2}>
          <div className={`${styles.card} ${styles.fullWidthCard}`}>
            <p className={styles.cardText}>{t('card.5.text', 'Удалёнка. В идеале полная, даже с работой из заграницы. Я готов рассмотреть другие варианты, но это всегда будет первый вопрос 😇')}</p>
          </div>
          <div className={`${styles.card} ${styles.fullWidthCard}`}>
            <p className={styles.cardText}>{t('card.7.text', 'Любую сферу, кроме игр. Мой опыт связан в основном с финтехом, но у меня есть ощутимый опыт работы и с другими направлениями. Питаю нежные чувства к админкам.')}</p>
          </div>
          <div className={`${styles.card} ${styles.fullWidthCard}`}>
            <p className={styles.cardText}>{t('card.8.text', 'Поменьше графдизайна. Я умею делать инфографику и презентации, но не люблю делать «графический дизайн». Я могу и умею не только приложения и сайты, но мне всегда тяжело делать сторисы или рекламу.')}</p>
          </div>
          <div className={`${styles.card} ${styles.fullWidthCard}`}>
            <p className={styles.cardText}>{t('card.9.text', 'Я хорошо раскрываю свой потенциал в небольших командах, даже если организация сама по себе большая.')}</p>
          </div>
        </div>
      </section>

      {/* ── Мои pros and cons ───────────────────────────────────────────── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          {t('title.3', 'Мои pros and cons')}
        </h2>
        <p className={styles.sectionLead}>
          {t('lead.3', 'Постараюсь объективно.')}
        </p>
        <div className={styles.cardsGrid2}>
          <div className={`${styles.card} ${styles.fullWidthCard}`}>
            <p className={styles.cardText}>{t('card.3.1.text', 'Хорошо вписываюсь в коллектив. У меня достаточно спокойствия и терпения, чтобы люди чувствовали себя рядом со мной комфортно и достаточно юмора и кругозора, чтобы не было скучно.')}</p>
          </div>
          <div className={`${styles.card} ${styles.fullWidthCard}`}>
            <p className={styles.cardText}>{t('card.3.2.text', 'Развита эмпатия. Хорошо помогает в работе. Но чтобы не перегореть — проскакивает цинизм.')}</p>
          </div>
          <div className={`${styles.card} ${styles.fullWidthCard}`}>
            <p className={styles.cardText}>{t('card.3.3.text', 'Я надёжный в работе. Но только если определены сроки, есть процессы и взаимодействие / общение с коллегами. Мне важна обратная связь и ощущение границ.')}</p>
          </div>
          <div className={`${styles.card} ${styles.fullWidthCard}`}>
            <p className={styles.cardText}>{t('card.3.4.text', 'У меня большой опыт контроля результатов работы других людей. Вижу косяки не только верстки, но и композиции, цветов, художественного замысла. Описываю проблемы корректно, предлагаю варианты решения.')}</p>
          </div>
          <div className={`${styles.card} ${styles.fullWidthCard}`}>
            <p className={styles.cardText}>{t('card.3.5.text', 'В своей работе у меня глаз не такой острый. Но конструктивную критику и корректно высказанные замечания воспринимаю хорошо.')}</p>
          </div>
          <div className={`${styles.card} ${styles.fullWidthCard}`}>
            <p className={styles.cardText}>{t('card.3.6.text', 'Я очень люблю оптимизировать процессы. Создаю скрипты и плагины если задачи частые и повторяющиеся. Тут важно вовремя остановиться.')}</p>
          </div>
        </div>
      </section>

      {/* ── Про меня / Что сейчас ────────────────────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.cardsGrid2}>
          <div className={`${styles.card} ${styles.fullWidthCard}`}>
            <h3 className={styles.cardTitle}>{t('card.10.title', 'Про меня')}</h3>
            <p className={styles.cardText}>{t('card.10.text', 'Дизайнер с большим опытом — источником забавных историй и лайфхаков, а не странных привычек и требований. Сотрудник, который любит пробовать новые технологии и использует нейросети не только как поисковик. Человек для которого нет ни бумера ни зумера, но классные коллеги. Тот парень, с которым комфортно работать.')}</p>
          </div>
          <div className={`${styles.card} ${styles.fullWidthCard}`}>
            <h3 className={styles.cardTitle}>{t('card.11.title', 'Что сейчас')}</h3>
            <p className={styles.cardText}>{t('card.11.text', 'Пока нахожусь в поиске, активно погрузился в освоение нейросетей. Этот сайт полностью сделан с помощью ИИ. Это не просто страницы, но и довольно мощная админка. С февраля работаю над довольно сложным проектом-стартапом. Реализую идеи основателя от дизайн-концепции до full-stack веб-приложения.')}</p>
          </div>
        </div>
      </section>

      {/* ── Резюме / Заключение ─────────────────────────────────────────── */}
      <section className={styles.section}>
        <div className={`${styles.card} ${styles.fullWidthCard}`}>
          <h3 className={styles.cardTitle}>{t('fin.1.title', 'Резюме')}</h3>
          <p className={styles.cardText}>{t('fin.2.text', 'Я очень серьёзно подошел к поиску работы и сильно заранее. Я насквозь пропитался страхами никогда не найти работу и правилами идеального резюме (CV у меня и правда образцовое). Больше не вывожу и тут всё своими руками.')}</p>
          <p className={styles.cardText}>{t('fin.3.text', 'Мне нужна работа, я хочу работать, я могу работать. И работаю я хорошо, спросите моих коллег: дизайнеров, проджектов, продактов, руководителей непосредственных и c-level.')}</p>
          <p className={styles.cardText}>{t('fin.4.text', 'Кроме непосредственно работы с интерфейсами и продуктами я ещё умею:')}</p>
          <p className={styles.cardText}>{t('fin.5.text', 'Делать презентации и отчеты. Инфографику для них.')}</p>
          <p className={styles.cardText}>{t('fin.6.text', 'Вайбкодить. У меня даже есть какая-никакая база. Писал диплом жене по фронтенду на Гикбрейнз в 2024 году.')}</p>
        </div>
      </section>

    </div>
  )
}
