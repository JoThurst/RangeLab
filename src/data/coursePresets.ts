/** Suggested simulator defaults — not live weather.
 *  moisture / firmness: 0–100 in source data, converted to 0–1 in apply helpers.
 */
export interface CoursePreset {
  id: string;
  course: string;
  location: string;
  windMph: number;
  elevationFt: number;
  /** 0–100 */
  moisture: number;
  /** 0–100 */
  firmness: number;
}

export const COURSE_PRESETS: CoursePreset[] = [
  {
    id: 'augusta',
    course: 'Augusta National',
    location: 'Georgia',
    windMph: 7,
    elevationFt: 310,
    moisture: 42,
    firmness: 72,
  },
  {
    id: 'pebble',
    course: 'Pebble Beach Golf Links',
    location: 'California',
    windMph: 14,
    elevationFt: 40,
    moisture: 58,
    firmness: 55,
  },
  {
    id: 'sawgrass',
    course: 'TPC Sawgrass',
    location: 'Florida',
    windMph: 10,
    elevationFt: 15,
    moisture: 72,
    firmness: 42,
  },
  {
    id: 'pinehurst',
    course: 'Pinehurst No. 2',
    location: 'North Carolina',
    windMph: 8,
    elevationFt: 510,
    moisture: 36,
    firmness: 88,
  },
  {
    id: 'oakmont',
    course: 'Oakmont Country Club',
    location: 'Pennsylvania',
    windMph: 9,
    elevationFt: 1160,
    moisture: 38,
    firmness: 92,
  },
  {
    id: 'shinnecock',
    course: 'Shinnecock Hills',
    location: 'New York',
    windMph: 16,
    elevationFt: 70,
    moisture: 48,
    firmness: 82,
  },
  {
    id: 'kiawah',
    course: 'Kiawah Island Ocean Course',
    location: 'South Carolina',
    windMph: 18,
    elevationFt: 15,
    moisture: 62,
    firmness: 58,
  },
  {
    id: 'whistling',
    course: 'Whistling Straits',
    location: 'Wisconsin',
    windMph: 15,
    elevationFt: 620,
    moisture: 50,
    firmness: 70,
  },
  {
    id: 'torrey',
    course: 'Torrey Pines South',
    location: 'California',
    windMph: 11,
    elevationFt: 300,
    moisture: 46,
    firmness: 68,
  },
  {
    id: 'bethpage',
    course: 'Bethpage Black',
    location: 'New York',
    windMph: 8,
    elevationFt: 150,
    moisture: 54,
    firmness: 64,
  },
  {
    id: 'riviera',
    course: 'Riviera Country Club',
    location: 'California',
    windMph: 6,
    elevationFt: 180,
    moisture: 40,
    firmness: 74,
  },
  {
    id: 'harbour-town',
    course: 'Harbour Town Golf Links',
    location: 'South Carolina',
    windMph: 12,
    elevationFt: 10,
    moisture: 68,
    firmness: 48,
  },
  {
    id: 'bay-hill',
    course: 'Bay Hill Club & Lodge',
    location: 'Florida',
    windMph: 11,
    elevationFt: 100,
    moisture: 66,
    firmness: 52,
  },
  {
    id: 'quail-hollow',
    course: 'Quail Hollow Club',
    location: 'North Carolina',
    windMph: 7,
    elevationFt: 670,
    moisture: 52,
    firmness: 66,
  },
  {
    id: 'st-andrews',
    course: 'The Old Course at St Andrews',
    location: 'Scotland',
    windMph: 20,
    elevationFt: 25,
    moisture: 64,
    firmness: 76,
  },
];

export function coursePresetToEnv(preset: CoursePreset): {
  windSpeedMph: number;
  elevationFt: number;
  fairwayMoisture: number;
  groundFirmness: number;
} {
  return {
    windSpeedMph: preset.windMph,
    elevationFt: preset.elevationFt,
    fairwayMoisture: preset.moisture / 100,
    groundFirmness: preset.firmness / 100,
  };
}
