# 🎯 Multi-Level HSK Quiz Platform

[![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5+-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3+-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)

> A modern online quiz platform for HSK (Hanyu Shuiping Kaoshi) Chinese proficiency testing, featuring multi-level difficulty, diverse question types, and intelligent learning tracking.

## ✨ Key Features

### 🎓 Multi-Level HSK Support
- **Level 1**: Basic 150 words - Entry-level Chinese learning
- **Level 3**: Intermediate 300 words - Essential daily communication
- **Level 4**: Advanced 600 words - Advanced Chinese mastery
- Each level features carefully curated core vocabulary databases

### 🧩 Diverse Quiz Modes
- **Chinese-English Translation**: Chinese→English / English→Chinese
- **Pinyin Practice**: Chinese→Pinyin / Pinyin→Chinese  
- **Multiple Choice**: Four-option smart generation with anti-guessing mechanisms
- **Mixed Mode**: Random switching between different question types for comprehensive ability

### 📊 Intelligent Learning Analytics
- **Real-time Statistics**: Accuracy rate, completion rate, response speed
- **Progress Tracking**: Personal best score records
- **Mistake Review**: Detailed answer explanations and review functionality
- **Multi-dimensional Assessment**: Analysis by vocabulary type and difficulty level

### 🎨 Modern User Experience
- **Responsive Design**: Perfect adaptation for desktop and mobile devices
- **Elegant Animations**: Smooth transitions and interactive feedback
- **Intuitive Interface**: Clear visual hierarchy and operation guidance
- **Accessibility Support**: WCAG-compliant accessible design

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0 or yarn >= 1.22.0

### Installation Steps

1. **Clone the Project**
   ```bash
   git clone <repository-url>
   cd Kimi_Agent_多级HSK测验网站/app
   ```

2. **Install Dependencies**
   ```bash
   npm install
   # or using yarn
   yarn install
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   # or using yarn
   yarn dev
   ```

4. **Access the Application**
   Open your browser and visit `http://localhost:5173`

### Building for Production
```bash
npm run build
# Preview build results
npm run preview
```

## 🏗️ Technical Architecture

### Frontend Technology Stack
- **Framework**: React 18.3.1 + TypeScript 5.5.3
- **Build Tool**: Vite 5.4.2
- **Styling Engine**: Tailwind CSS 3.4.1
- **State Management**: React Hooks (useState, useEffect, useCallback)
- **Animation Library**: Framer Motion 11.3.19
- **Icon System**: Lucide React 0.417.0
- **UI Components**: Radix UI (Tabs, Progress, Dialog, Select)
- **Data Visualization**: Recharts 2.12.7

### Project Structure
```
app/
├── public/                 # Static assets
├── src/
│   ├── App.tsx           # Main application component (1200+ lines)
│   ├── main.tsx          # Application entry point
│   └── index.css         # Global styles
├── package.json          # Project configuration and dependencies
├── vite.config.ts        # Vite build configuration
├── tailwind.config.js    # Tailwind theme configuration
├── tsconfig.json         # TypeScript configuration
└── README.md            # Project documentation
```

## 📚 User Guide

### 🎮 Starting a Quiz
1. Visit the homepage to view overall learning progress
2. Click any HSK level card to enter the selection page
3. Choose quiz mode (Chinese-English, Pinyin, or Mixed)
4. Set number of questions (5-20 questions)
5. Start your challenge!

### 📈 Viewing Statistics
- **Home Dashboard**: Overall progress overview
- **Selection Page**: Detailed statistics for each level
- **Results Page**: Complete analysis of current quiz
- **Review Mode**: Question-by-question answer explanations

### ⚙️ Personalized Settings
- Customizable question count
- Flexible quiz mode switching
- Intelligent difficulty adaptation
- Data persistence (localStorage)

## 🧪 Feature Details

### Intelligent Question Bank System
- **Dynamic Option Generation**: Generate distractors based on real vocabulary database
- **Difficulty Balance**: Ensure option plausibility and misleading nature
- **Anti-duplication Mechanism**: Prevent consecutive similar question types

### Learning Algorithms
- **Adaptive Difficulty**: Adjust question difficulty based on user performance
- **Knowledge Graph**: Track vocabulary mastery levels
- **Spaced Repetition**: Memory reinforcement based on forgetting curve

### Data Persistence
- **Local Storage**: Automatically save learning progress
- **Cross-session Sync**: Data preserved after browser closure
- **Privacy Protection**: Data stored only on user device

## 🎯 HSK Vocabulary Database

### Level 1 (Basic - 150 Words)
Covers fundamental daily life vocabulary:
- Personal pronouns: 我、你、他、她、它 (I, you, he, she, it)
- Basic verbs: 是、有、在、去、来 (to be, to have, to be at, to go, to come)
- Common nouns: 人、家、学校、老师、学生 (person, home, school, teacher, student)

### Level 3 (Intermediate - 300 Words)  
Extended to core daily communication vocabulary:
- Time expressions: 今天、明天、昨天、现在 (today, tomorrow, yesterday, now)
- Location descriptions: 中国、北京、公司、医院 (China, Beijing, company, hospital)
- Emotional expressions: 高兴、喜欢、想、知道 (happy, like, want, know)

### Level 4 (Advanced - 600 Words)
Advanced academic and business vocabulary:
- Abstract concepts: 经济、社会、文化、发展 (economy, society, culture, development)
- Complex actions: 解决、提高、实现、影响 (solve, improve, achieve, influence)
- Professional terms: 教育、环境、技术、管理 (education, environment, technology, management)

## 🔧 Development Guide

### Code Standards
- **TypeScript**: Strict type checking and interface definitions
- **ESLint**: Code quality inspection and best practices
- **Prettier**: Unified code formatting
- **Componentization**: Single responsibility principle, high cohesion low coupling

### State Management Strategy
- **Local State**: useState for component internal state
- **Derived State**: useMemo for performance optimization
- **Side Effects**: useEffect for lifecycle and async operations
- **Event Handling**: useCallback prevents unnecessary re-renders

### Performance Optimization
- **Code Splitting**: Vite automatic on-demand loading
- **Lazy Loading**: Dynamic import for large components
- **Virtual Scrolling**: Long list optimization (reserved)
- **Caching Strategy**: Calculation results and API response caching

## 🤝 Contribution Guidelines

We welcome community contributions! Please follow these steps:

1. Fork the project repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Standards
- Follow existing code style and naming conventions
- Add necessary TypeScript types and comments
- Ensure all test cases pass
- Update relevant documentation

## 🐛 Troubleshooting

### Common Issues

**Q: Slow page loading**
A: Check network connection, clear browser cache, or try incognito mode

**Q: Data not saving**
A: Ensure browser localStorage is enabled, check privacy settings

**Q: Mobile display issues**
A: Confirm viewport settings, try refreshing page or updating browser

**Q: TypeScript compilation errors**
A: Run `npm run type-check` to check type issues

### Debug Mode
```bash
# Enable verbose logging
DEBUG=true npm run dev

# Check build artifacts
npm run build && npm run preview
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

- [Official HSK Vocabulary List](http://www.chinesetest.cn/) - Authoritative vocabulary source
- [React Team](https://reactjs.org/) - Excellent UI framework
- [Tailwind CSS](https://tailwindcss.com/) - Efficient styling solution
- [Lucide](https://lucide.dev/) - Beautiful icon library

## 📞 Contact Us

- **Project Maintainer**: Kimi Agent Team
- **Email**: support@kimi-agent.dev
- **Project Repository**: https://github.com/kimi-agent/hsk-quiz-platform
- **Issue Reporting**: [GitHub Issues](https://github.com/kimi-agent/hsk-quiz-platform/issues)

---

<div align="center">
  <strong>🎉 Making Chinese learning simpler and more enjoyable!</strong>
  <br>
  Made with ❤️ by HSK Quiz Platform Team
</div>