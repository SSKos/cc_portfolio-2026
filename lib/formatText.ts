/**
 * Типографическое форматирование текста.
 * Все текстовые поля ДОЛЖНЫ проходить через formatText() перед сохранением в БД.
 *
 * Портировано из v1 (frontend/src/utils/typography.ts).
 */

const NON_BREAKING_SPACE = '\u00A0';
const NON_BREAKING_HYPHEN = '\u2011';
const LEFT_QUOTE = '\u00AB'; // «
const RIGHT_QUOTE = '\u00BB'; // »
const LONG_DASH = '\u2014'; // —

/** Граница слова (не после буквы/цифры) — работает с кириллицей */
const WB = '(?<![а-яёА-ЯЁa-zA-Z0-9])';
/** Граница слова (не перед буквой/цифрой) */
const WA = '(?![а-яёА-ЯЁa-zA-Z0-9])';

const UNITS = [
  'кг', 'г', 'мг', 'т',
  'м', 'км', 'см', 'мм', 'дм',
  'л', 'мл',
  'руб', 'коп', '₽', '$', '€',
  'гг', 'г.',
  'тыс.', 'млн.', 'млрд.',
  'тыс', 'млн', 'млрд',
  'шт', 'ед',
  '°C', '°F', '°',
  '%',
  'Вт', 'кВт', 'МВт',
  'ГБ', 'МБ', 'КБ', 'байт',
];

const COUNT_WORDS = ['гл', 'стр', 'п', 'пп', '§', '№', 'п.', 'стр.', 'гл.'];
const ONE_LETTER_PREPOSITIONS = ['а', 'и', 'к', 'о', 'с', 'у', 'в', 'б'];
const TWO_LETTER_WORDS = [
  'но', 'да', 'то', 'от', 'до', 'из', 'за', 'на', 'по', 'со',
  'во', 'об', 'про', 'при', 'без', 'над', 'под', 'перед', 'через', 'между',
];
const CONJUNCTIONS = [
  'или', 'либо', 'что', 'чтобы', 'как', 'так', 'чем', 'тем',
  'если', 'хотя', 'пока', 'когда',
];

export function cleanText(text: string): string {
  if (!text) return '';
  let s = text.trim();
  if (!s) return '';

  s = s.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  s = s.replace(/[ \t\f\v]+/g, ' ');
  s = s.replace(/[ \t\f\v]+([.,;:!?])/g, '$1');
  s = s.replace(/([.,;:!?])[ \t\f\v]+/g, '$1 ');

  return s;
}

export function applyTypography(text: string): string {
  if (!text) return '';
  let s = text;

  // Кавычки → ёлочки
  s = s.replace(/"([^"]*)"/g, `${LEFT_QUOTE}$1${RIGHT_QUOTE}`);
  s = s.replace(/'([^']*)'/g, `${LEFT_QUOTE}$1${RIGHT_QUOTE}`);

  // Дефис с пробелами → длинное тире
  s = s.replace(/\s+-\s+/g, `${NON_BREAKING_SPACE}${LONG_DASH}${NON_BREAKING_SPACE}`);
  s = s.replace(/([.!?…])\s*-\s+/g, `$1${NON_BREAKING_SPACE}${LONG_DASH}${NON_BREAKING_SPACE}`);
  s = s.replace(/\n\s*-\s+/g, `\n${LONG_DASH}${NON_BREAKING_SPACE}`);

  // Дефис внутри слова → неразрывный дефис
  s = s.replace(/([а-яёА-ЯЁa-zA-Z])-(?=[а-яёА-ЯЁa-zA-Z])/g, `$1${NON_BREAKING_HYPHEN}`);

  // Числа + единицы измерения
  UNITS.forEach(unit => {
    const escaped = unit.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(\\d+)\\s+${escaped}${WA}`, 'gi');
    s = s.replace(re, `$1${NON_BREAKING_SPACE}${unit}`);
  });

  // Числа + счётные слова
  COUNT_WORDS.forEach(word => {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(\\d+)\\s+${escaped}${WA}`, 'gi');
    s = s.replace(re, `$1${NON_BREAKING_SPACE}${word}`);
  });

  // №, § + число
  s = s.replace(/([№§])\s+(\d+)/g, `$1${NON_BREAKING_SPACE}$2`);

  // Инициалы + фамилия
  s = s.replace(
    /([А-ЯЁ]\.)\s+([А-ЯЁ]\.)\s+([А-ЯЁ][а-яё]+)/g,
    `$1${NON_BREAKING_SPACE}$2${NON_BREAKING_SPACE}$3`,
  );

  // Сокращения
  s = s.replace(new RegExp(`${WB}и\\s+т\\.\\s+д\\.`, 'gi'), `и${NON_BREAKING_SPACE}т.${NON_BREAKING_SPACE}д.`);
  s = s.replace(new RegExp(`${WB}т\\.\\s+е\\.`, 'gi'), `т.${NON_BREAKING_SPACE}е.`);
  s = s.replace(new RegExp(`${WB}и\\s+т\\.\\s+п\\.`, 'gi'), `и${NON_BREAKING_SPACE}т.${NON_BREAKING_SPACE}п.`);

  // Неразрывный пробел перед длинным тире
  s = s.replace(/\s+—/g, `${NON_BREAKING_SPACE}—`);

  // «не» + слово
  s = s.replace(new RegExp(`${WB}не\\s+([а-яё]+)`, 'gi'), `не${NON_BREAKING_SPACE}$1`);

  // Слово + частицы «бы», «ли», «же»
  s = s.replace(new RegExp(`\\s+(бы|ли|же)${WA}`, 'gi'), `${NON_BREAKING_SPACE}$1`);

  // Географические сокращения
  s = s.replace(
    new RegExp(`${WB}(г|ул|пр|пер|пл|д|стр)\\.\\s+([А-ЯЁ])`, 'gi'),
    `$1.${NON_BREAKING_SPACE}$2`,
  );

  // Слова 1–2 буквы → неразрывный пробел после
  s = s.replace(new RegExp(`${WB}([а-яёА-ЯЁa-zA-Z]{1,2})(\\s+)`, 'g'), (match, word, spaces) => {
    if (spaces.includes(NON_BREAKING_SPACE)) return match;
    return `${word}${NON_BREAKING_SPACE}`;
  });

  // Предлоги и союзы (дополнительная страховка)
  [...ONE_LETTER_PREPOSITIONS, ...TWO_LETTER_WORDS, ...CONJUNCTIONS].forEach(prep => {
    const re = new RegExp(`${WB}${prep}(\\s+)(?!\\d)`, 'gi');
    s = s.replace(re, (match, spaces) => {
      if (spaces.includes(NON_BREAKING_SPACE)) return match;
      return `${prep}${NON_BREAKING_SPACE}`;
    });
  });

  // Защита последнего слова от висячей строки
  s = s.replace(/\s+(\S+)$/, `${NON_BREAKING_SPACE}$1`);

  return s;
}

/**
 * Полная обработка: очистка + типографика.
 * Вызывать перед сохранением любого текстового поля в БД.
 */
export function formatText(text: string): string {
  return applyTypography(cleanText(text));
}
