import fs from 'fs';

const path = 'app/App.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Replace isRestoringSession splash render
const t1 = `  const renderScreen = () => {
    if (isRestoringSession) return <SplashScreen />;`;

const r1 = `  const renderScreen = () => {
    if (isRestoringSession) {
      return (
        <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
          <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        </View>
      );
    }`;

// 2. Replace fontsLoaded splash render
const t2 = `  if (!fontsLoaded) return <SplashScreen />;`;
const r2 = `  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      </View>
    );
  }`;

let norm = content.replace(/\r\n/g, '\n');
const normT1 = t1.replace(/\r\n/g, '\n');
const normR1 = r1.replace(/\r\n/g, '\n');
const normT2 = t2.replace(/\r\n/g, '\n');
const normR2 = r2.replace(/\r\n/g, '\n');

if (norm.includes(normT1)) {
  norm = norm.replace(normT1, normR1);
  console.log('Replaced t1');
} else {
  console.log('t1 not found');
}

if (norm.includes(normT2)) {
  norm = norm.replace(normT2, normR2);
  console.log('Replaced t2');
} else {
  console.log('t2 not found');
}

content = norm.replace(/\n/g, '\r\n');
fs.writeFileSync(path, content, 'utf8');
console.log('App.js updated successfully');

