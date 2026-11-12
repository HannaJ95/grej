export interface TermsSection {
  // The #fragment that Innehåll links to.
  id: string;
  title: string;
  // A string is a paragraph, and a list of strings a bulleted list.
  content: (string | string[])[];
}

// Only says what the shop and the API really do. No company details, contact or VAT, which the
// shop doesn't have (scope.md).
export const TERMS_SECTIONS: TermsSection[] = [
  {
    id: 'saljare',
    title: 'Vem som säljer',
    content: [
      'GREJ är ett examensarbete och inget företag. Butiken säljer handgjorda grejer från små skapare, och vi väljer ut varje grej själva.',
      'Eftersom GREJ inte är ett företag finns inget organisationsnummer. Butiken har heller ingen kontaktväg, som e-post eller telefon.',
    ],
  },
  {
    id: 'bestallning',
    title: 'Beställning och betalning',
    content: [
      [
        'Priserna står i svenska kronor.',
        'Du betalar på Stripes egen betalsida. Butiken är i Stripes testläge, så inga riktiga pengar dras.',
        'Kortuppgifterna stannar hos Stripe. Vi ser dem aldrig och sparar dem inte.',
        'När betalningen är klar får du en orderbekräftelse med e-post, med ordernumret, det du har köpt och leveransadressen.',
      ],
    ],
  },
  {
    id: 'frakt',
    title: 'Frakt',
    content: [
      [
        'Vi skickar med PostNord som Paket till ombud, och bara inom Sverige.',
        'Frakten räknas på hela beställningens vikt och storlek, och du ser den i varukorgen innan du betalar.',
        'Vi packar din beställning inom 1–2 arbetsdagar. Sedan hämtar du ut paketet hos ditt PostNord-ombud, normalt inom 2–4 arbetsdagar.',
      ],
    ],
  },
  {
    id: 'handgjort',
    title: 'Om handgjorda grejer',
    content: [
      'Allt i butiken är gjort för hand, så inga två grejer är exakt likadana. Små skillnader i form, färg och yta mot bilderna är en del av hantverket och inget fel.',
    ],
  },
  {
    id: 'angerratt',
    title: 'Ångerrätt',
    content: [
      'När du handlar på nätet har du 14 dagars ångerrätt. Den räknas från dagen du hämtar ut paketet.',
    ],
  },
  {
    id: 'retur',
    title: 'Retur',
    content: [
      'I demobutiken skickas inga paket, så det finns inget att skicka tillbaka. Butiken har heller ingen kontaktväg där du kan anmäla en retur.',
    ],
  },
  {
    id: 'reklamation',
    title: 'Reklamation',
    content: [
      'Eftersom inga paket skickas kan ingen grej komma fram trasig eller fel. Butiken har heller ingen kontaktväg där du kan reklamera.',
    ],
  },
  {
    id: 'tvister',
    title: 'Tvister',
    content: ['Köpen i demobutiken görs inte på riktigt, så det finns inga tvister att lösa.'],
  },
  {
    id: 'personuppgifter',
    title: 'Personuppgifter',
    content: [
      'När du betalar fyller du i namn, e-post och adress på Stripes betalsida. Först när betalningen är klar sparar vi dem på din beställning. Om en beställning sparar vi:',
      [
        'ditt namn och din e-postadress',
        'leveransadressen: gatuadress, postnummer, ort och land',
        'vad du har köpt, hur många och till vilket pris',
        'fraktsättet, frakten och totalsumman',
        'ordernumret, datumet och Stripes id för betalningen',
      ],
      'Inga kortuppgifter och inget telefonnummer sparas.',
      'Uppgifterna används för orderbekräftelsen och för att packa och skicka paketet. Bara butikens admin kan se dem.',
      'Stripe tar emot betalningen, Resend skickar orderbekräftelsen och databasen ligger hos Supabase.',
      'Beställningar raderas inte i butiken. De försvinner först när demobutiken återställs.',
    ],
  },
  {
    id: 'lagring',
    title: 'Kakor och lagring',
    content: [
      'GREJ sätter inga egna kakor (cookies) och har ingen spårning eller besöksstatistik.',
      'Två saker sparas i din webbläsare (localStorage):',
      [
        'varukorgen, så att den finns kvar när du laddar om sidan',
        'ditt val av ljust eller mörkt läge, om du har gjort ett',
      ],
      'Typsnitten hämtas från Google Fonts och bilderna från Supabase, så din webbläsare kontaktar deras servrar. Supabases server sätter en teknisk kaka, __cf_bm, som skyddar mot bottar och försvinner efter 30 minuter.',
      'Stripes betalsida är Stripes egen sida, med Stripes egna villkor.',
    ],
  },
];
