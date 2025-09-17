// Theme Test Script
// This script tests the theme switching functionality

// Function to test theme switching
function testThemeSwitching() {
  console.log('Testing theme switching functionality...');
  
  // Check if ThemeProvider is properly set up
  if (!document.querySelector('.theme-light') && !document.querySelector('body.dark')) {
    console.log('Theme classes not found on document. Make sure ThemeProvider is properly set up.');
    return false;
  }
  
  // Get the theme toggle button
  const themeToggleButton = document.querySelector('button[aria-label="Switch to Light Mode"], button[aria-label="Switch to Dark Mode"]');
  
  if (!themeToggleButton) {
    console.log('Theme toggle button not found. Make sure ThemeToggle component is properly rendered.');
    return false;
  }
  
  // Get initial theme
  const initialTheme = localStorage.getItem('jq-playground-theme') || 'dark';
  console.log(`Initial theme: ${initialTheme}`);
  
  // Click the theme toggle button
  themeToggleButton.click();
  
  // Get new theme
  const newTheme = localStorage.getItem('jq-playground-theme');
  console.log(`New theme after toggle: ${newTheme}`);
  
  // Verify theme changed
  if ((initialTheme === 'dark' && newTheme === 'light') || 
      (initialTheme === 'light' && newTheme === 'dark')) {
    console.log('Theme toggle successful!');
    
    // Check if theme class is applied to document
    if (newTheme === 'light' && document.documentElement.classList.contains('theme-light')) {
      console.log('Light theme class properly applied to document.');
    } else if (newTheme === 'dark' && !document.documentElement.classList.contains('theme-light')) {
      console.log('Dark theme class properly applied to document.');
    } else {
      console.log('Theme class not properly applied to document.');
      return false;
    }
    
    // Toggle back to original theme
    themeToggleButton.click();
    const finalTheme = localStorage.getItem('jq-playground-theme');
    console.log(`Final theme after second toggle: ${finalTheme}`);
    
    if (finalTheme === initialTheme) {
      console.log('Successfully toggled back to original theme.');
      return true;
    } else {
      console.log('Failed to toggle back to original theme.');
      return false;
    }
  } else {
    console.log('Theme toggle failed. Theme did not change as expected.');
    return false;
  }
}

// Function to test theme persistence
function testThemePersistence() {
  console.log('Testing theme persistence across page reloads...');
  
  // Get current theme
  const currentTheme = localStorage.getItem('jq-playground-theme') || 'dark';
  console.log(`Current theme before reload: ${currentTheme}`);
  
  // Store theme for comparison after reload
  sessionStorage.setItem('theme-test-previous-theme', currentTheme);
  
  // Instruct user to reload page
  console.log('Please reload the page and run testThemePersistenceAfterReload() to complete this test.');
}

// Function to check theme after reload
function testThemePersistenceAfterReload() {
  const previousTheme = sessionStorage.getItem('theme-test-previous-theme');
  const currentTheme = localStorage.getItem('jq-playground-theme') || 'dark';
  
  console.log(`Previous theme: ${previousTheme}`);
  console.log(`Current theme after reload: ${currentTheme}`);
  
  if (previousTheme === currentTheme) {
    console.log('Theme persistence test passed! Theme was preserved across page reload.');
    
    // Check if theme class is applied correctly
    if (currentTheme === 'light' && document.documentElement.classList.contains('theme-light')) {
      console.log('Light theme class properly applied after reload.');
      return true;
    } else if (currentTheme === 'dark' && !document.documentElement.classList.contains('theme-light')) {
      console.log('Dark theme class properly applied after reload.');
      return true;
    } else {
      console.log('Theme class not properly applied after reload.');
      return false;
    }
  } else {
    console.log('Theme persistence test failed! Theme was not preserved across page reload.');
    return false;
  }
}

// Instructions for running tests
console.log(`
Theme Testing Instructions:
1. Run testThemeSwitching() to test theme toggle functionality
2. Run testThemePersistence() before reloading the page
3. After reloading, run testThemePersistenceAfterReload() to verify theme persistence
`);

// Export test functions to global scope for console access
window.testThemeSwitching = testThemeSwitching;
window.testThemePersistence = testThemePersistence;
window.testThemePersistenceAfterReload = testThemePersistenceAfterReload;