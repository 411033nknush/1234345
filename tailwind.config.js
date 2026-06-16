module.exports = {
  content: ['./*.html', './*.js'],
  theme: {
    extend: {
      colors: {
        ink: '#040816',
        panel: '#0f172a',
        panelSoft: '#111827',
        panelStrong: '#172033',
        line: '#243244',
        text: '#eff6ff',
        muted: '#cbd5e1',
        accent: '#8b5cf6',
        glow: '#22d3ee',
        success: '#34d399',
        danger: '#fca5a5'
      },
      boxShadow: {
        glow: '0 18px 40px rgba(15, 23, 42, 0.45)',
        halo: '0 12px 30px rgba(139, 92, 246, 0.18)'
      }
    }
  },
  plugins: []
};
