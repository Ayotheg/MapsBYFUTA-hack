/**
 * Editable Events data for Explore -> Events.
 * To add events or upload posters:
 *  1. Drop poster images inside `public/images/events/` (e.g. `tech-week.jpg`).
 *  2. Add or edit objects in `PLACEHOLDER_EVENTS` below.
 * If your live API payload includes an `events` array, API items are used instead.
 */
export const EVENT_FILTER_TABS = ['All', 'Today', 'This week', 'Free', 'Paid'];

export const PLACEHOLDER_EVENTS = [
  {
    id: 'event-tech-week',
    title: 'Tech Week Kick-off',
    organizer: 'FUTA Tech Community',
    month: 'OCT',
    day: '24',
    fullDate: 'Friday, 24 October',
    time: 'Fri · 10:00 AM',
    timeRange: '10:00 AM – 2:00 PM',
    venue: 'Obafemi Awolowo Auditorium',
    venueHint: 'Near the Senate Building',
    isOnline: false,
    priceLabel: 'Free',
    ticketNote: 'No ticket needed',
    isFree: true,
    timeframe: 'this-week',
    poster: '/images/events/tech-week.jpg',
    about:
      'Opening keynote, live student demos, and networking across software, hardware, and design tracks. Open to all departments — bring your laptop and student ID.',
    featured: true,
    url: '',
  },
  {
    id: 'event-freshers-hangout',
    title: "Freshers' Hangout",
    organizer: 'FUTA Student Union',
    month: 'OCT',
    day: '26',
    fullDate: 'Sunday, 26 October',
    time: 'Sun · 4:00 PM',
    timeRange: '4:00 PM – 7:00 PM',
    venue: 'Sports Complex',
    venueHint: 'Obanla Campus',
    isOnline: false,
    priceLabel: 'Free',
    ticketNote: 'No ticket needed',
    isFree: true,
    timeframe: 'this-week',
    poster: '/images/events/freshers-hangout.jpg',
    about:
      'Meet fellow 100-level students, seniors, and campus clubs over games, music, and light refreshments. Great way to learn your way around campus.',
    featured: true,
    url: '',
  },
  {
    id: 'event-cv-clinic',
    title: 'CV & LinkedIn Clinic',
    organizer: 'Career & Alumni Desk',
    month: 'OCT',
    day: '28',
    fullDate: 'Tuesday, 28 October',
    time: 'Tue · 7:00 PM',
    timeRange: '7:00 PM – 8:30 PM',
    venue: 'Online · Google Meet',
    venueHint: 'Join from anywhere',
    isOnline: true,
    priceLabel: 'Free',
    ticketNote: 'No ticket needed',
    isFree: true,
    timeframe: 'this-week',
    poster: '',
    about:
      'Practical walkthrough on crafting internship-ready CVs and optimizing your LinkedIn profile for SIWES and graduate roles. Bring a draft CV for live feedback.',
    featured: false,
    url: '',
  },
];
