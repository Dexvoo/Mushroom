// Terms of Service and Privacy Policy, moved here from the old ovxbot.com site.
// Each section is a heading with paragraphs; a paragraph given as an array is a bulleted list.

export const CONTACT_EMAIL = 'ovxbot@gmail.com';

export const LEGAL_PAGES = {
    tos: {
        title: 'Terms of Service',
        updated: '13 January 2024',
        intro: 'By accessing and using the Ovx Discord Bot, you agree to comply with the following Terms of Service. These terms outline your rights, responsibilities, and acceptable use of the Bot. If you do not agree with any part of these terms, please refrain from using the Bot.',
        sections: [
            {
                heading: 'Use of the Bot',
                body: [
                    'The Bot is provided "as is" without any warranty of any kind. The Ovx development team reserves the right to modify, suspend, or terminate the Bot\'s services at any time without prior notice. You agree to use the Bot in compliance with all applicable laws and regulations.',
                ],
            },
            {
                heading: 'User Conduct',
                body: [
                    'Users are expected to use the Bot responsibly and ethically. Do not engage in activities that may harass, abuse, or harm other users. Distribution of spam, phishing attempts, or any other malicious content is strictly prohibited. Respect the privacy of other users, and do not share personal information without their explicit consent.',
                ],
            },
            {
                heading: 'Disclaimer',
                body: [
                    'Users acknowledge that they use the Bot at their own risk. The Ovx development team is not responsible for any damages or loss resulting from the use of the Bot.',
                ],
            },
            {
                heading: 'Changes to Terms',
                body: [
                    'The Ovx development team reserves the right to update or modify these Terms of Service at any time. Users are encouraged to review these terms regularly. Continued use of the Bot after any changes will constitute acceptance of the modified terms.',
                ],
            },
            {
                heading: 'Termination',
                body: [
                    "The Ovx development team reserves the right to terminate a user's access to the Bot at any time, with or without cause.",
                ],
            },
            {
                heading: 'Contact',
                body: ['For inquiries or concerns regarding these Terms of Service, please contact us at:'],
                email: true,
            },
        ],
        closing:
            'By using the Ovx Discord bot, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.',
    },
    privacypolicy: {
        title: 'Privacy Policy',
        updated: '13 January 2024',
        intro: 'This Privacy Policy outlines how the Ovx Discord Bot collects, uses, and protects user information. By using the Bot, you consent to the terms of this Privacy Policy.',
        sections: [
            {
                heading: 'Information We Collect',
                body: [
                    'The Bot may collect and store the following information:',
                    ['Discord user IDs', 'Server and channel IDs', 'Command usage and preferences'],
                ],
            },
            {
                heading: 'How We Use Collected Information',
                body: [
                    'We use the collected information for the following purposes:',
                    [
                        "Providing and maintaining the Bot's services",
                        'Improving and customizing user experience',
                        'Responding to user inquiries and support requests',
                    ],
                ],
            },
            {
                heading: 'Data Security',
                body: [
                    'We take reasonable measures to protect the collected information from unauthorized access, disclosure, alteration, or destruction. However, please note that no method of transmission over the internet or electronic storage is 100% secure.',
                ],
            },
            {
                heading: 'Third-Party Services',
                body: [
                    'The Bot may use third-party services for various purposes, such as analytics or support. These services have their own privacy policies, and we encourage you to review them.',
                ],
            },
            {
                heading: 'Changes to Privacy Policy',
                body: [
                    'We reserve the right to update or modify this Privacy Policy at any time. Users are encouraged to review this policy regularly. Continued use of the Bot after any changes will constitute acceptance of the modified policy.',
                ],
            },
            {
                heading: 'Contact',
                body: ['For inquiries or concerns regarding this Privacy Policy, please contact us at:'],
                email: true,
            },
        ],
        closing:
            'By using the Ovx Discord bot, you acknowledge that you have read, understood, and agree to the terms of this Privacy Policy.',
    },
};
