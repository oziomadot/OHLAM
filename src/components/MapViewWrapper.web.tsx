import React from 'react';

interface Props {
  latitude: number;
  longitude: number;
}

// Simple web fallback. You can replace this with a Google Maps iframe if desired.
const MapViewWrapper: React.FC<Props> = ({ latitude, longitude }) => {
  const url = `https://maps.google.com/?q=${latitude},${longitude}`;
  return (
    <div style={styles.container as React.CSSProperties}>
      <div style={styles.placeholder as React.CSSProperties}>
        <div style={styles.title as React.CSSProperties}>Map preview (web)</div>
        <div style={styles.coords as React.CSSProperties}>
          {latitude.toFixed(5)}, {longitude.toFixed(5)}
        </div>
        <a href={url} target="_blank" rel="noreferrer" style={styles.link as React.CSSProperties}>
          Open in Google Maps
        </a>
      </div>
    </div>
  );
};

const styles = {
  container: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    overflow: 'hidden',
    background: '#f3f4f6',
  },
  placeholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    color: '#374151',
    gap: 6,
  },
  title: {
    fontWeight: 600,
  },
  coords: {
    fontFamily: 'monospace',
    fontSize: 12,
    opacity: 0.8,
  },
  link: {
    marginTop: 6,
    color: '#2563eb',
    textDecoration: 'underline',
    fontSize: 12,
  },
};

export default MapViewWrapper;
