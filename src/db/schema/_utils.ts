import { timestamp } from 'drizzle-orm/pg-core';

export const ID_LENGTH = 13;
export const SUPABASE_USER_ID_LENGTH = 36;

export const timestamps = {
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
  deletedAt: timestamp(),
};

/**
 * Generates a unique ID with configurable total length (including prefix)
 * @param options Configuration options for ID generation
 * @returns A string in the format '[prefix]xxxx-xxxx' with total specified length
 * @example
 * generateId({ length: 12, prefix: 'prj-' }) // => 'prj-kjd3-ce7'
 * generateId({ length: 8 }) // => 'k3m5-n2p'
 */
export const generateId = ({ length = 10, prefix = '' }) => {
  if (prefix && (length < prefix.length || !/^[a-z0-9_-]+$/.test(prefix))) throw Error('invalid');
  const c = 'abcdefghijkmnopqrstuvwxyz23456789',
    g = 4,
    p = prefix ? prefix.length : 0,
    R = length - p;
  let u = 0;
  const a = [];
  while (u < R) {
    const L = u + g >= R ? R - u : g;
    let s = '';
    for (let i = 0; i < L; i++) s += c[(Math.random() * c.length) | 0];
    a.push(s);
    u += L + (u + g >= R ? 0 : 1);
  }
  return (prefix || '') + a.join('-');
};

// > How can we introduce branching? conditional responses? if this, this stage, if that, that stage?
// > Can the user set instructions in each stage on which next stage to go to?
//  > Maybe for each stage child section there is a text box (this stage if persona wants this, this other stage if persona wants that)

// > Is it possible to set no drop off? maybe for like improving a certain mandatory process?
// > Things like conversion rate may not be make sense for some funnels
// > How will referencing past experience for a persona work?

// > How about for summary, we can chat about the response? we can also ask to chat to each persona in the simulation?
// > Do we need to save personaConfig for each simulation? (this goes for persona as well)
// > How can we add time data to response such as waiting time, user comes back at a later time? etc

// How do we know how many persona are going to each stage?
// > Currently simulation stage does not have complete as it is not possible to know when a persona is going to the next stage
// > is it better if summary stages is not connected to summary at all?
