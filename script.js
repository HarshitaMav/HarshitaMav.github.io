// Enhanced Portfolio JavaScript

// Utility functions
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

// Global variables
let currentSlide = 0;
let blogData = [];
let chatbotActive = false;

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    initializeProjectSlider();
    initializeAnimations();
    initializeChatbot();
    loadMediumBlogs();
    initializeSkillHovers();
    initializeTypingEffect();
    initializeScrollAnimations();
});

// Navigation functionality
function initializeNavigation() {
    const navLinks = $$('.nav-menu a');
    const sections = $$('section');
    
    // Active navigation highlighting
    window.addEventListener('scroll', () => {
        let currentSection = '';
        const scrollPosition = window.scrollY + 100;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                currentSection = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSection}`) {
                link.classList.add('active');
            }
        });
    });
    
    // Smooth scrolling for navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = $(`#${targetId}`);
            
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Project slider functionality
function initializeProjectSlider() {
    const slider = $('#projectsSlider');
    const prevBtn = $('#prevBtn');
    const nextBtn = $('#nextBtn');
    const cards = $$('.project-card');
    const cardWidth = 370; // card width + gap
    let maxSlide = Math.max(0, cards.length - 3);
    
    function updateSlider() {
        const translateX = -currentSlide * cardWidth;
        slider.style.transform = `translateX(${translateX}px)`;
        
        // Update button states
        prevBtn.style.opacity = currentSlide === 0 ? '0.5' : '1';
        nextBtn.style.opacity = currentSlide === maxSlide ? '0.5' : '1';
    }
    
    prevBtn.addEventListener('click', () => {
        if (currentSlide > 0) {
            currentSlide--;
            updateSlider();
        }
    });
    
    nextBtn.addEventListener('click', () => {
        if (currentSlide < maxSlide) {
            currentSlide++;
            updateSlider();
        }
    });
    
    // Auto-slide functionality
    setInterval(() => {
        if (currentSlide >= maxSlide) {
            currentSlide = 0;
        } else {
            currentSlide++;
        }
        updateSlider();
    }, 5000);
    
    // Touch/swipe support for mobile
    let startX = 0;
    let isDragging = false;
    
    slider.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        isDragging = true;
    });
    
    slider.addEventListener('touchend', (e) => {
        if (!isDragging) return;
        
        const endX = e.changedTouches[0].clientX;
        const diff = startX - endX;
        
        if (Math.abs(diff) > 50) {
            if (diff > 0 && currentSlide < maxSlide) {
                currentSlide++;
            } else if (diff < 0 && currentSlide > 0) {
                currentSlide--;
            }
            updateSlider();
        }
        
        isDragging = false;
    });
    
    updateSlider();
}

// Typing effect for hero section
function initializeTypingEffect() {
    const text = "Harsita is a machine learning engineer and full-stack developer";
    const element = $('.typewriter');
    
    if (element) {
        element.innerHTML = '';
        let i = 0;
        
        function typeWriter() {
            if (i < text.length) {
                element.innerHTML += text.charAt(i);
                i++;
                setTimeout(typeWriter, 50);
            }
        }
        
        setTimeout(typeWriter, 1000);
    }
}

// Chatbot functionality
function initializeChatbot() {
    const chatbotFab = $('#chatbotFab');
    const chatbotContainer = $('#chatbotContainer');
    const chatbotToggle = $('#chatbotToggle');
    const chatbotInput = $('#chatbotInput');
    const chatbotSend = $('#chatbotSend');
    const chatbotMessages = $('#chatbotMessages');
    
    // Chatbot responses database
    const responses = {
        greeting: [
            "Hello! I'm here to help you learn about Harsita's experience and skills.",
            "Hi there! Ask me anything about Harsita's projects, experience, or technical expertise.",
            "Welcome! I can tell you about Harsita's work in AI/ML and full-stack development."
        ],
        experience: [
            "Harsita has over 2 years of experience in AI/ML engineering at Metamorphosys Technologies, where she led the Data Science team and developed an AutoML Framework that reduced development time by 80%.",
            "She has worked as a Machine Learning Engineer, Research Assistant, and Software Developer, with expertise in fraud detection, OCR systems, and LLM integration."
        ],
        skills: [
            "Harsita is proficient in Python, JavaScript, TensorFlow, React.js, and many other technologies. She specializes in AI/ML frameworks, full-stack development, and DevOps.",
            "Her technical skills include machine learning, deep learning, computer vision, natural language processing, and full-stack web development."
        ],
        projects: [
            "Some of Harsita's notable projects include an LLM-Powered AI Chatbot with 95% accuracy, a full-stack e-commerce platform, and face recognition systems with adversarial masking techniques.",
            "She has built fraud detection systems, OCR applications, and AutoML frameworks that are used in production environments."
        ],
        education: [
            "Harsita is currently pursuing her Master's in Computer Science at Syracuse University (2025-2027) and has a Bachelor's in Information Technology from University of Mumbai with a 9.19/10.0 GPA."
        ],
        default: [
            "That's an interesting question! You can ask me about Harsita's experience, skills, projects, education, or any specific technology she works with.",
            "I'm here to help! Try asking about her AI/ML projects, work experience, or technical skills.",
            "Feel free to ask me about Harsita's background, projects, or any specific aspect of her portfolio you'd like to know more about."
        ]
    };
    
    function getResponse(message) {
        const msg = message.toLowerCase();
        
        if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
            return getRandomResponse('greeting');
        } else if (msg.includes('experience') || msg.includes('work') || msg.includes('job')) {
            return getRandomResponse('experience');
        } else if (msg.includes('skill') || msg.includes('technology') || msg.includes('tech')) {
            return getRandomResponse('skills');
        } else if (msg.includes('project') || msg.includes('portfolio') || msg.includes('work')) {
            return getRandomResponse('projects');
        } else if (msg.includes('education') || msg.includes('study') || msg.includes('university')) {
            return getRandomResponse('education');
        } else {
            return getRandomResponse('default');
        }
    }
    
    function getRandomResponse(category) {
        const responseArray = responses[category];
        return responseArray[Math.floor(Math.random() * responseArray.length)];
    }
    
    function addMessage(message, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
        messageDiv.innerHTML = `<p>${message}</p>`;
        chatbotMessages.appendChild(messageDiv);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }
    
    function sendMessage() {
        const message = chatbotInput.value.trim();
        if (message) {
            addMessage(message, true);
            chatbotInput.value = '';
            
            // Simulate typing delay
            setTimeout(() => {
                const response = getResponse(message);
                addMessage(response);
            }, 1000);
        }
    }
    
    // Event listeners
    chatbotFab.addEventListener('click', () => {
        chatbotContainer.classList.add('active');
        chatbotActive = true;
    });
    
    chatbotToggle.addEventListener('click', () => {
        chatbotContainer.classList.remove('active');
        chatbotActive = false;
    });
    
    chatbotSend.addEventListener('click', sendMessage);
    
    chatbotInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}

// Resume download functionality
function downloadResume() {
    // Create a link element and trigger download
    const link = document.createElement('a');
    link.href = 'assets/Harsita-Mav.pdf'; // Make sure to add the resume file
    link.download = 'Harsita-Mav-Resume.pdf';
    link.click();
    
    // Optional: Track download event
    console.log('Resume downloaded');
}

// Medium blogs loading functionality
async function loadMediumBlogs() {
    const blogsGrid = document.getElementById('blogsGrid');
    const mediumUsername = 'harsita-mav'; // Replace with actual Medium username
    
    try {
        // Using RSS2JSON service to fetch Medium articles
        const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/@${mediumUsername}`);
        const data = await response.json();
        
        if (data.status === 'ok') {
            const blogData = data.items.slice(0, 6); // Get latest 6 articles
            displayBlogs(blogData);
        } else {
            displayStaticBlogsNoImage(); // Fallback without images
        }
    } catch (error) {
        console.error('Error loading Medium blogs:', error);
        displayStaticBlogsNoImage(); // Fallback without images
    }
}


function displayBlogs(blogs) {
    const blogsGrid = $('#blogsGrid');
    
    if (blogs.length === 0) {
        blogsGrid.innerHTML = `
            <div class="blog-loading">
                <p>No articles found. Check back soon for new content!</p>
            </div>
        `;
        return;
    }
    
    blogsGrid.innerHTML = blogs.map(blog => {
        const publishDate = new Date(blog.pubDate).toLocaleDateString();
        const category = blog.categories && blog.categories.length > 0 ? blog.categories[0] : 'General';
        
        return `
            <article class="blog-card" data-category="${category.toLowerCase()}">
                <div class="blog-image">
                    <img src="${blog.thumbnail || 'images/blog-placeholder.jpg'}" alt="${blog.title}" loading="lazy">
                </div>
                <div class="blog-content">
                    <div class="blog-category">${category}</div>
                    <h3>${blog.title}</h3>
                    <p>${blog.description.substring(0, 120)}...</p>
                    <div class="blog-meta">
                        <span>${publishDate}</span>
                        <a href="${blog.link}" target="_blank" rel="noopener noreferrer">Read more</a>
                    </div>
                </div>
            </article>
        `;
    }).join('');
    
    // Initialize blog filters
    initializeBlogFilters();
}

function initializeBlogFilters() {
    const filterBtns = $$('.filter-btn');
    const blogCards = $$('.blog-card');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active filter
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const filter = btn.dataset.filter;
            
            // Filter blog cards
            blogCards.forEach(card => {
                if (filter === 'all' || card.dataset.category.includes(filter)) {
                    card.style.display = 'block';
                    card.style.animation = 'fadeInUp 0.6s ease-out';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}

function displayBlogError() {
    const blogsGrid = $('#blogsGrid');
    blogsGrid.innerHTML = `
        <div class="blog-loading">
            <p>Unable to load articles at the moment. Please check back later.</p>
        </div>
    `;
}

function initializeBlogFilters() {
    const filterBtns = $$('.filter-btn');
    const blogCards = $$('.blog-card');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active filter
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const filter = btn.dataset.filter;
            
            // Filter blog cards
            blogCards.forEach(card => {
                if (filter === 'all' || card.dataset.category.includes(filter)) {
                    card.style.display = 'block';
                    card.style.animation = 'fadeInUp 0.6s ease-out';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}

// Scroll animations
function initializeScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animatedElements = $$('.project-card, .timeline-item, .research-card, .blog-card, .skill-category');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(el);
    });
}

// Initialize other animations
function initializeAnimations() {
    // Parallax effect for hero section
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const parallax = $('.hero');
        
        if (parallax) {
            const speed = scrolled * 0.5;
            parallax.style.backgroundPositionY = `${speed}px`;
        }
    });
    
    // Floating animation for cards
    const floatingElements = $$('.floating-card, .about-profile-image');
    floatingElements.forEach((el, index) => {
        el.style.animationDelay = `${index * 0.5}s`;
    });
}

// Skill hover effects
function initializeSkillHovers() {
    const skillTags = $$('.skill-tags span');
    
    skillTags.forEach(tag => {
        tag.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.1)';
        });
        
        tag.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    });
}

// Contact form functionality (if needed)
function initializeContactForm() {
    const contactForm = $('#contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Here you can add form submission logic
            const formData = new FormData(this);
            const data = Object.fromEntries(formData);
            
            console.log('Form submitted:', data);
            
            // Show success message
            alert('Thank you for your message! I\'ll get back to you soon.');
            this.reset();
        });
    }
}

// Theme switcher (optional feature)
function initializeThemeSwitcher() {
    const themeToggle = $('#themeToggle');
    
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('light-theme');
            localStorage.setItem('theme', document.body.classList.contains('light-theme') ? 'light' : 'dark');
        });
        
        // Load saved theme
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') {
            document.body.classList.add('light-theme');
        }
    }
}

// Performance optimization
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Optimized scroll handler
const optimizedScrollHandler = debounce(() => {
    // Add any scroll-based functionality here
}, 10);

window.addEventListener('scroll', optimizedScrollHandler);

// Error handling
window.addEventListener('error', (e) => {
    console.error('Portfolio error:', e.error);
});

// Service worker registration (for PWA capabilities)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Export functions for use in HTML
window.downloadResume = downloadResume;
