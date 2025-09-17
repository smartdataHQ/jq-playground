// Script to generate a large array JSON file for testing Row Mode
// This will create an array with 15,000 items to test the automatic detection for large arrays

const fs = require('fs');

// Generate a random item
function generateItem(index) {
  const statuses = ['active', 'inactive', 'pending', 'archived'];
  const tags = ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6', 'tag7', 'tag8', 'tag9', 'tag10'];
  
  // Select 1-3 random tags
  const numTags = Math.floor(Math.random() * 3) + 1;
  const selectedTags = [];
  for (let i = 0; i < numTags; i++) {
    const randomTag = tags[Math.floor(Math.random() * tags.length)];
    if (!selectedTags.includes(randomTag)) {
      selectedTags.push(randomTag);
    }
  }
  
  // Generate random dates within the last year
  const now = new Date();
  const createdDate = new Date(now.getTime() - Math.random() * 365 * 24 * 60 * 60 * 1000);
  const updatedDate = new Date(createdDate.getTime() + Math.random() * (now.getTime() - createdDate.getTime()));
  
  return {
    id: index + 1,
    name: `Item ${index + 1}`,
    description: `This is item number ${index + 1}`,
    value: Math.round(Math.random() * 1000) / 10,
    isActive: Math.random() > 0.3,
    tags: selectedTags,
    metadata: {
      created: createdDate.toISOString().split('T')[0],
      updated: updatedDate.toISOString().split('T')[0],
      status: statuses[Math.floor(Math.random() * statuses.length)]
    }
  };
}

// Generate the array
const numItems = 15000;
const largeArray = [];

for (let i = 0; i < numItems; i++) {
  largeArray.push(generateItem(i));
}

// Write to file
fs.writeFileSync('test-large-array.json', JSON.stringify(largeArray, null, 2));

console.log(`Generated test-large-array.json with ${numItems} items`);