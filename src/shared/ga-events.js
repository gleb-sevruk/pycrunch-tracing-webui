
export function track (eventCategory, eventAction, eventLabel, eventValue) {
    if (!window.dataLayer) {
        console.warn('dataLayer not found on the page. Is it dev build?')
        return
    }
    dataLayer.push(
      {
        'event': 'event-to-ga',
        'eventCategory' : eventCategory,
        'eventAction' : eventAction,
        'eventLabel' : eventLabel,
        'eventValue' : eventValue });
  }

