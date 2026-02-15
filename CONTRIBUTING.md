# Contributing to AI Brain

Thank you for your interest in contributing to AI Brain! 🧠

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:
- Clear title and description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Your environment (OS, Node version, etc.)

### Suggesting Features

We love new ideas! Open an issue with:
- Clear feature description
- Use case / problem it solves
- Proposed implementation (optional)

### Pull Requests

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow existing code style
   - Add comments for complex logic
   - Update documentation if needed

4. **Test thoroughly**
   - Test on backend (port 3000)
   - Test on frontend (port 5173)
   - Test with multiple personas
   - Check console for errors

5. **Commit with clear messages**
   ```bash
   git commit -m "Add: New feature description"
   git commit -m "Fix: Bug description"
   git commit -m "Update: Documentation changes"
   ```

6. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR-USERNAME/ai-brain.git
cd ai-brain

# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Set up .env file
cp backend/.env.example backend/.env
# Edit .env with your credentials

# Start development servers
cd backend && npm start
cd frontend && npm run dev
```

## Code Style

- **JavaScript:** Use ES6+ features
- **Indentation:** 2 spaces
- **Semicolons:** Not required but consistent
- **Naming:** camelCase for variables, PascalCase for components
- **Comments:** Explain "why", not "what"

## Project Structure

```
backend/src/
├── api/         # Express routes
├── services/    # Business logic
├── jobs/        # Background tasks
└── db/          # Database connection

frontend/src/
├── components/  # React components
└── styles/      # CSS files
```

## Testing

Before submitting a PR:
- [ ] Backend starts without errors
- [ ] Frontend builds successfully
- [ ] All features work as expected
- [ ] No console errors
- [ ] Code follows style guide

## Questions?

Feel free to open a discussion or reach out in issues!

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the problem, not the person
- Help others learn and grow

Thank you for contributing! 🎉
