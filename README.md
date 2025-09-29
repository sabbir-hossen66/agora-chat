# 💬 Real-Time Chat Application

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-14.0-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-18.0-blue?style=for-the-badge&logo=react)
![Agora Chat](https://img.shields.io/badge/Agora-Chat-orange?style=for-the-badge&logo=agora)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)

**A modern, real-time chat application built with Next.js and Agora Chat SDK featuring read receipts, typing indicators, and seamless messaging.**

[**Live Demo**](#-live-demo) • [**Features**](#-features) • [**Installation**](#-installation) • [**Usage**](#-usage) • [**Screenshots**](#-screenshots)

</div>

---

## 🌟 Live Demo

🚀 **Access the application**: [live-link](https://drive.google.com/drive/folders/11h23wIAEi9GLOCV6e9sh8yW2lFqG2Vhr) 
---

## ✨ Features

### 🔥 Core Features
- ✅ **Real-time Messaging** - Instant message delivery
- ✅ **Read Receipts** - See when messages are delivered and read
- ✅ **Typing Indicators** - Know when others are typing
- ✅ **Online Status** - Real-time user presence
- ✅ **Conversation List** - Organized chat history
- ✅ **Message Status** - Visual delivery confirmation

### 🎨 UI/UX Features
- 🎯 **Modern Design** - Clean, intuitive interface
- 📱 **Fully Responsive** - Works on all devices
- 🚀 **Fast Performance** - Optimized with Next.js
- 🎪 **Smooth Animations** - Enhanced user experience

---

## 🛠️ Tech Stack

| Technology | Purpose | Version |
|------------|---------|---------|
| **Next.js** | Framework | 14.x |
| **React** | UI Library | 18.x |
| **Agora Chat** | Real-time Messaging | 1.5.x |
| **Tailwind CSS** | Styling | 3.x |
| **Lucide React** | Icons | 0.263.x |

---

## 📥 Installation

### Prerequisites
- Node.js 18+ installed
- Agora account ([Sign up here](https://www.agora.io/))

### Step-by-Step Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/nextjs-chat-app.git
   cd nextjs-chat-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_AGORA_APP_ID=your_agora_app_id
   NEXT_PUBLIC_AGORA_TOKEN=your_agora_token
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

---

## 🎯 Usage

### Getting Started
1. **Login** with your credentials
2. **Select a conversation** from the sidebar
3. **Start chatting** in real-time
4. **See typing indicators** when others type
5. **Check read receipts** for message status

### Key Features Usage

#### 💬 Sending Messages
- Type your message in the input field
- Press `Enter` or click the send button
- Watch for delivery and read status

#### 👥 Managing Conversations
- Click on any user to start chatting
- Search for specific conversations
- See online/offline status indicators

#### 📱 Mobile Experience
- Fully responsive design
- Touch-friendly interface
- Smooth navigation

---

## 📁 Project Structure

```
nextjs-chat-app/
├── public/
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.js
│   │   └── page.js
│   ├── components/
│   │   ├── Chat/
│   │   ├── Sidebar/
│   │   └── UI/
│   ├── lib/
│   │   ├── agora.js
│   │   └── utils.js
│   └── hooks/
├── .env.local
├── package.json
└── README.md
```

---

## 🔧 Configuration

### Agora Chat Setup
1. Create an Agora account
2. Get your App ID from the Agora Console
3. Generate a token for authentication
4. Add credentials to `.env.local`

### Tailwind CSS
The project uses Tailwind CSS for styling. Configuration is in `tailwind.config.js`.

---

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repo to Vercel
3. Add environment variables
4. Deploy automatically

### Other Platforms
- **Netlify**: Follow similar steps
- **Railway**: Deploy with one command
- **Docker**: Use the included Dockerfile

---

## 🔒 Security Features

- ✅ Token-based authentication
- ✅ Message encryption
- ✅ User validation
- ✅ Rate limiting
- ✅ XSS protection

---

## 📊 Performance

- ⚡ **Fast Loading**: Optimized with Next.js
- 🎯 **Real-time**: Sub-second message delivery
- 📱 **Mobile First**: Responsive design
- 🔄 **Offline Support**: Message queuing

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Support

- 📧 **Email**: support@yourchatapp.com
- 💬 **Discord**: [Join our community](https://discord.gg/yourchatapp)
- 📖 **Documentation**: [Read the docs](https://docs.yourchatapp.com)

---

## 🙏 Acknowledgments

- [Agora.io](https://www.agora.io/) for the Chat SDK
- [Next.js](https://nextjs.org/) team for the amazing framework
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS
- [Lucide](https://lucide.dev/) for the beautiful icons

---

<div align="center">

**Built with ❤️ by [Sabbir Hossen](https://github.com/yourusername)**

⭐ **Star this repo if you found it helpful!** ⭐

</div>