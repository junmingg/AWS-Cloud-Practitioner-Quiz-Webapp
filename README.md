# AWS Cloud Practitioner Quiz Platform

A modern, interactive quiz application for AWS Certified Cloud Practitioner exam preparation built with SvelteKit and SkeletonUI.

![AWS Quiz Platform](https://img.shields.io/badge/AWS-Cloud%20Practitioner-orange?style=for-the-badge&logo=amazon-aws)
![SvelteKit](https://img.shields.io/badge/SvelteKit-FF3E00?style=for-the-badge&logo=Svelte&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

## ✨ Features

### 🎯 **Comprehensive Practice System**
- **23 Complete Practice Exams** with real AWS Cloud Practitioner questions
- **Two Question Types**: Multiple Choice (MCQ) and Multiple Choice Multiple Answer (MCMA)
- **Practice & Exam Modes** for different learning approaches
- **Progress Tracking** with detailed statistics and performance analytics

### 🎨 **Modern User Experience**
- **Dark/Light Mode** with system preference detection
- **Responsive Design** works perfectly on desktop, tablet, and mobile
- **Smooth Animations** and transitions for enhanced user experience
- **Accessible Design** with keyboard navigation and screen reader support

### ⚡ **Smart Features**
- **Keyboard Shortcuts**: 1-5 for options A-E, Space to submit, F to flag, S/H for sidebars
- **Question Flagging** for review during exams
- **Auto-save** functionality to never lose progress
- **Offline Support** with local data persistence
- **Advanced Navigation** with question sidebar and filtering

### 📊 **Performance Analytics**
- **Detailed Results** with question-by-question breakdown
- **Score History** tracking across all attempts
- **Performance Statistics** including pass rate and average scores
- **Progress Indicators** with visual feedback

### ⚙️ **Customization Options**
- **Timer Controls** (show/hide exam timer)
- **Review Mode** for studying with immediate feedback
- **Settings Management** with quiz history controls
- **Data Export** capabilities for progress tracking

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/junmingg/AWS-Cloud-Practitioner-Quiz-Webapp.git
   cd AWS-Cloud-Practitioner-Quiz-Webapp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   ```
   http://localhost:5173
   ```

### Building for Production

```bash
# Build the application
npm run build

# Preview production build
npm run preview
```

## 🛠️ Tech Stack

- **Framework**: [SvelteKit](https://kit.svelte.dev/) - Full-stack web framework
- **UI Library**: [SkeletonUI](https://www.skeleton.dev/) - Svelte component library
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- **Language**: [TypeScript](https://www.typescriptlang.com/) - Type-safe JavaScript
- **Build Tool**: [Vite](https://vitejs.dev/) - Fast build tool and dev server
- **State Management**: Svelte stores with persistent localStorage
- **Markdown Processing**: Custom parser for exam content

## 📁 Project Structure

```
src/
├── routes/                 # SvelteKit pages and layouts
│   ├── +layout.svelte     # Main app layout with navigation
│   ├── +page.svelte       # Home page with exam selection
│   ├── exam/[id]/         # Dynamic exam routes
│   └── results/[id]/      # Results display pages
├── lib/
│   ├── components/        # Reusable Svelte components
│   │   ├── Question.svelte        # Question display with options
│   │   ├── QuestionNav.svelte     # Question navigation sidebar
│   │   ├── HotkeySidebar.svelte   # Keyboard shortcuts help
│   │   ├── Timer.svelte           # Exam timer component
│   │   └── Settings.svelte        # Settings modal
│   ├── stores/           # Svelte stores for state management
│   │   ├── quiz.ts       # Quiz state and logic
│   │   ├── results.ts    # Results and history management
│   │   └── theme.ts      # Theme and preferences
│   ├── utils/           # Utility functions
│   │   ├── markdown-parser.ts  # Parse exam markdown files
│   │   ├── scorer.ts           # Score calculation logic
│   │   └── exam-loader.ts      # Exam loading and caching
│   └── types/           # TypeScript type definitions
└── static/             # Static assets and exam files
```

## 🎮 Usage Guide

### Taking Practice Exams

1. **Choose Your Mode**
   - **Practice Mode**: Get immediate feedback on each question
   - **Exam Mode**: Complete all questions before seeing results

2. **Navigate Through Questions**
   - Use the **sidebar** to jump to any question
   - **Filter questions** by answered, unanswered, or flagged
   - Use **keyboard shortcuts** for faster navigation

3. **Answering Questions**
   - **MCQ**: Select one correct answer
   - **MCMA**: Select exactly two correct answers
   - **Flag questions** for review using F key or flag button

4. **Review Results**
   - See **detailed breakdown** of correct/incorrect answers
   - Read **explanations** for each question
   - Track your **progress over time**

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `1-5` | Select options A-E |
| `Space` | Submit selected answers |
| `←/→` | Navigate between questions |
| `F` | Flag/unflag current question |
| `S` | Toggle question navigation sidebar |
| `H` | Toggle keyboard shortcuts help |

## 🔧 Configuration

### Environment Variables

Create a `.env` file for custom configuration:

```bash
# Custom exam content path (optional)
PUBLIC_EXAM_PATH=/custom/path/to/exams

# Analytics (optional)
PUBLIC_ANALYTICS_ID=your-analytics-id
```

### Customization

The app supports extensive customization through:

- **Theme system** with CSS custom properties
- **Component props** for behavior modification  
- **Store configuration** for default settings
- **Build-time configuration** in `svelte.config.js`

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- AWS Cloud Practitioner exam content and structure
- SvelteKit and SkeletonUI communities for excellent documentation
- Contributors and testers who helped improve the application

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/junmingg/AWS-Cloud-Practitioner-Quiz-Webapp/issues) page
2. Create a new issue with detailed information
3. For general questions, use the [Discussions](https://github.com/junmingg/AWS-Cloud-Practitioner-Quiz-Webapp/discussions) tab

---

**Happy studying and good luck with your AWS Cloud Practitioner certification!** 🎉