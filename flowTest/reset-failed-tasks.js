// Reset Failed Tasks Script
// This script can be run in the browser console to trigger the reset functionality

console.log('🔄 Starting failed task reset...');

// Clear localStorage for upload tasks
if (typeof localStorage !== 'undefined') {
  console.log('📦 Clearing localStorage...');
  const currentTasks = JSON.parse(localStorage.getItem('uploadTasks') || '[]');
  const cleanTasks = currentTasks.filter(task => 
    task.status !== 'failed' && task.status !== 'cancelled'
  );
  localStorage.setItem('uploadTasks', JSON.stringify(cleanTasks));
  console.log(`✅ Removed ${currentTasks.length - cleanTasks.length} failed tasks from localStorage`);
}

// Clear sessionStorage as well
if (typeof sessionStorage !== 'undefined') {
  console.log('📦 Clearing sessionStorage...');
  sessionStorage.removeItem('uploadTasks');
  sessionStorage.removeItem('uploadState');
}

// Trigger browser reload to force context reinitialization
console.log('🔄 Reloading page to refresh context...');
window.location.reload();