# Contributing to Notch Widget

Thank you for your interest in contributing to Notch Widget! This document provides guidelines and instructions for contributing to the project.

## 🌟 Ways to Contribute

- 🐛 **Report bugs** - Found a bug? Let us know!
- 💡 **Suggest features** - Have an idea? We'd love to hear it!
- 📝 **Improve documentation** - Help make our docs better
- 🔧 **Submit code** - Fix bugs or implement features
- 🎨 **Design improvements** - Enhance the UI/UX

## 🚀 Getting Started

### Prerequisites

- macOS 11.0 or later (for testing)
- Node.js 16.x or later
- npm 7.x or later
- Git
- A MacBook Pro with notch (for full testing)

### Setup Development Environment

1. **Fork the repository**
   - Click the "Fork" button on GitHub

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/MacbookNotch.git
   cd MacbookNotch/notch-widget
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/ajaymore/MacbookNotch.git
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Start development**
   ```bash
   npm start
   ```

## 📋 Development Workflow

### 1. Create a Branch

Always create a new branch for your work:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Adding tests

### 2. Make Your Changes

- Write clean, readable code
- Follow existing code style
- Add comments for complex logic
- Test your changes thoroughly

### 3. Commit Your Changes

Write clear, concise commit messages:

```bash
git add .
git commit -m "feat: add timer sound notification option"
```

Commit message format:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

### 4. Keep Your Fork Updated

```bash
git fetch upstream
git rebase upstream/main
```

### 5. Push Your Changes

```bash
git push origin feature/your-feature-name
```

### 6. Submit a Pull Request

1. Go to your fork on GitHub
2. Click "New Pull Request"
3. Select your branch
4. Fill out the PR template:
   - Describe your changes
   - Reference any related issues
   - Add screenshots if applicable
5. Submit the PR

## 🧪 Testing

Before submitting a PR, ensure:

- [ ] The app builds successfully (`npm run build`)
- [ ] The app runs without errors (`npm start`)
- [ ] All features work as expected
- [ ] No console errors or warnings
- [ ] Changes don't break existing functionality

### Testing Checklist

- [ ] Timer functionality (countdown/stopwatch)
- [ ] Media player (drag & drop, playback)
- [ ] Files tray (add, remove, open files)
- [ ] Notes and snippets
- [ ] Settings persistence
- [ ] Window behavior (expand/collapse)
- [ ] macOS notch integration

## 📝 Code Style Guidelines

### JavaScript/JSX

- Use modern ES6+ syntax
- Prefer functional components and hooks
- Use meaningful variable and function names
- Add JSDoc comments for complex functions
- Keep functions small and focused

```javascript
// Good
const handleTimerStart = () => {
  setIsRunning(true);
  startTimer();
};

// Avoid
const f = () => { /* ... */ };
```

### React Components

- One component per file
- Use PascalCase for component names
- Use camelCase for props and handlers
- Destructure props

```jsx
// Good
const TimerDisplay = ({ time, isRunning, onToggle }) => {
  return (
    <div className="timer">
      <span>{formatTime(time)}</span>
      <button onClick={onToggle}>
        {isRunning ? 'Pause' : 'Start'}
      </button>
    </div>
  );
};
```

### CSS

- Use clear, descriptive class names
- Follow BEM naming convention where applicable
- Group related styles together
- Add comments for complex styles

## 🐛 Reporting Bugs

When reporting bugs, please include:

1. **Description** - Clear description of the bug
2. **Steps to reproduce** - How to trigger the bug
3. **Expected behavior** - What should happen
4. **Actual behavior** - What actually happens
5. **Screenshots** - If applicable
6. **Environment**:
   - macOS version
   - Node.js version
   - App version
   - MacBook model

### Bug Report Template

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- macOS: [e.g. 14.0 Sonoma]
- Node: [e.g. 18.17.0]
- App Version: [e.g. 0.2.0]
- MacBook: [e.g. 16" M2 Max]

**Additional context**
Any other context about the problem.
```

## 💡 Suggesting Features

Feature requests are welcome! Please include:

1. **Problem statement** - What problem does this solve?
2. **Proposed solution** - How should it work?
3. **Alternatives** - Other solutions you've considered
4. **Use cases** - When would this be useful?
5. **Mockups** - Visual representation (if applicable)

## 📜 Code of Conduct

### Our Standards

- Be respectful and inclusive
- Welcome newcomers
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards others

### Unacceptable Behavior

- Harassment or discriminatory language
- Trolling or insulting comments
- Personal or political attacks
- Publishing others' private information
- Other unprofessional conduct

## 🔍 Review Process

After submitting a PR:

1. **Automated checks** - CI/CD runs tests
2. **Code review** - Maintainers review your code
3. **Feedback** - You may receive change requests
4. **Approval** - Once approved, it will be merged

### Review Criteria

- Code quality and style
- Functionality and correctness
- Performance impact
- Documentation updates
- Test coverage

## 📞 Getting Help

- **Questions?** - Open a [Discussion](https://github.com/ajaymore/MacbookNotch/discussions)
- **Issues?** - Check [existing issues](https://github.com/ajaymore/MacbookNotch/issues)
- **Need support?** - Ask in discussions or issues

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Notch Widget! 🎉
