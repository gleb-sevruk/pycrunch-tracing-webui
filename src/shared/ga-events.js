
export function track (eventCategory, eventAction, eventLabel, eventValue) {
    dataLayer.push(
      {
        'event': 'event-to-ga',
        'eventCategory' : eventCategory,
        'eventAction' : eventAction,
        'eventLabel' : eventLabel,
        'eventValue' : eventValue });
  }

