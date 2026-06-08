import type { WsEvent } from "../types/quiz";

type EventTimelineProps = { events: WsEvent[] };

function EventTimeline({ events }: EventTimelineProps) {
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-header-left">
          <div className="card-subtitle">WebSocket Stream</div>
          <div className="card-title">⚡ Live Events</div>
        </div>
      </div>
      <div className="event-list">
        {events.length === 0 ? (
          <p className="empty-text">Events appear after connecting</p>
        ) : (
          events.map((event, i) => (
            <div className="event-item" key={i}>
              <div className="event-type">{event.type}</div>
              <pre>{JSON.stringify(event.payload ?? {}, null, 2)}</pre>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default EventTimeline;
