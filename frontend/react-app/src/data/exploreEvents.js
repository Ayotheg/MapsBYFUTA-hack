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
    month: 'OCT',
    day: '24',
    time: 'Fri · 10:00 AM',
    venue: 'Obafemi Awolowo Auditorium',
    isOnline: false,
    priceLabel: 'Free',
    isFree: true,
    timeframe: 'this-week',
    poster: '/images/events/tech-week.jpg',
    featured: true,
    url: '',
  },
  {
    id: 'event-freshers-hangout',
    title: "Freshers' Hangout",
    month: 'OCT',
    day: '26',
    time: 'Sun · 4:00 PM',
    venue: 'Sports Complex',
    isOnline: false,
    priceLabel: 'Free',
    isFree: true,
    timeframe: 'this-week',
    poster: '/images/events/freshers-hangout.jpg',
    featured: true,
    url: '',
  },
  {
    id: 'event-cv-clinic',
    title: 'CV & LinkedIn Clinic',
    month: 'OCT',
    day: '28',
    time: 'Tue · 7:00 PM',
    venue: 'Online · Google Meet',
    isOnline: true,
    priceLabel: 'Free',
    isFree: true,
    timeframe: 'this-week',
    poster: '',
    featured: false,
    url: '',
  },
];
