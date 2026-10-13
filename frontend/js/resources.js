/* resources.js - Resources page (uses the shared catalog page from main.js) */
initCatalogPage({
  endpoint: '/api/resources',
  singular: 'Resource',
  plural: 'Resources',
  iconName: 'layers',
  visitLabel: 'Open Resource',
  videoLabel: 'Reference Video (Optional)',
  emptyText: 'No resources added yet.',
  categories: ['Python', 'Java', 'SQL', 'Data Science', 'Machine Learning', 'Artificial Intelligence', 'DSA', 'GitHub', 'Cloud', 'Statistics', 'Visualization', 'Development', 'Documentation', 'Other']
});
