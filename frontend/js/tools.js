/* tools.js - Tools page (uses the shared catalog page from main.js) */
initCatalogPage({
  endpoint: '/api/tools',
  singular: 'Tool',
  plural: 'Tools',
  iconName: 'tool',
  visitLabel: 'Visit Website',
  videoLabel: 'Video / Reference Video (Optional)',
  emptyText: 'No tools added yet.',
  categories: ['Programming Language', 'IDE / Editor', 'Library / Framework', 'Database', 'Visualization', 'Version Control', 'Cloud Platform', 'Notebook', 'Other']
});
