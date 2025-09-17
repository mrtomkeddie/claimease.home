# ClaimEase - AI-Powered PIP Helper

A comprehensive web application for helping users build strong, evidence-backed answers for their PIP (Personal Independence Payment) claims.

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## 📋 Features

- **Step 1: Upload Documents** - AI-powered document analysis
- **Step 2: Build Main Answers** - 12 key PIP activities with scoring
- **Step 3: Add Supporting Details** - Comprehensive form questions
- **Dark Theme** - Pure black with teal, mint, and tan accents
- **Glass Morphism** - Modern UI with backdrop blur effects
- **Responsive Design** - Desktop-first, mobile optimized
- **Real-time Progress** - Track completion across all sections

## 🎨 Design System

- **Colors:** Black (#000000), Teal (#4EB9B9), Light Mint (#B7E4D6), Warm Tan (#C3936C)
- **Typography:** System fonts with accessibility-focused sizing
- **Components:** Shadcn/ui with custom ClaimEase styling
- **Effects:** Glass morphism, subtle gradients, smooth transitions

## 🏗️ Tech Stack

- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Tailwind CSS v4** - Utility-first styling
- **Vite** - Fast build tool
- **Shadcn/ui** - Accessible component library
- **Lucide React** - Icon library

## 📁 Project Structure

```
├── components/          # Reusable UI components
│   ├── ui/             # Shadcn/ui components
│   └── ...             # Custom components
├── contexts/           # React contexts
├── lib/               # Utility functions
├── styles/            # Global CSS
└── src/               # Application entry point
```

## 🔧 Configuration

### Environment Variables
- `VITE_APP_NAME` - Application name
- `VITE_FIREBASE_*` - Firebase configuration (if using)
- `VITE_API_BASE_URL` - API endpoint

### Build Configuration
- **Vite:** Modern build tool with HMR
- **TypeScript:** Strict type checking
- **ESLint:** Code linting and formatting

## 🚀 Deployment

### Firebase Hosting
```bash
npm run firebase:deploy
```

### Other Platforms
```bash
npm run build
# Deploy the 'dist' folder to your hosting platform
```

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is proprietary to ClaimEase. All rights reserved.

## 🆘 Support

For technical support or questions:
- Email: support@claimease.app
- Documentation: https://docs.claimease.app
