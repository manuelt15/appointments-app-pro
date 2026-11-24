import type { es } from './es'

export const en: typeof es = {
  'nav.home': 'Home',
  'nav.schedule': 'Schedule',
  'nav.employees': 'Employees',
  'nav.history': 'History',
  'nav.settings': 'Settings',
  'nav.newShift': 'New shift',
  'nav.collapse': 'Collapse sidebar',
  'nav.expand': 'Expand sidebar',
  'nav.openNavigation': 'Open navigation',
  'nav.navigation': 'Navigation',
  'nav.mainNavigation': 'Main navigation',
  'nav.themeSystem': 'Theme: System',
  'nav.themeLight': 'Theme: Light',
  'nav.themeDark': 'Theme: Dark',
  'nav.languageGroup': 'Language',
  'nav.languageSpanish': 'Spanish',
  'nav.languageEnglish': 'English',
  'nav.languageCurrent': 'Current language: {name}',
  'nav.account': 'Account',
  'nav.accountLabel': 'Account: {name}',
  'nav.you': 'you',
  'nav.signedInWith': 'Signed in with {name}',
  'nav.email': 'email',
  'nav.signOut': 'Sign out',
  'common.cancel': 'Cancel',

  // Settings: header and keys card
  'settings.title': 'Settings',
  'settings.subtitle': 'API keys and integrations',
  'settings.apiKeys.announceGenerated': 'API key generated.',
  'settings.apiKeys.newKeyTitle': 'New API key',
  'settings.apiKeys.newKeyBody': 'Copy it now. It won\'t be shown again.',
  'settings.apiKeys.copyNewAria': 'Copy new API key',
  'settings.apiKeys.dismiss': 'Dismiss',
  'settings.apiKeys.title': 'API keys',
  'settings.apiKeys.intro':
    'An API key is a password for a program, not for a person. A program that has it can read and change this schedule without signing in as you. That is how an agent like Claude Code connects, so you can ask it who works on Friday or to book next week\'s shifts.',
  'settings.apiKeys.warningTitle': 'Treat this key like a password',
  'settings.apiKeys.warningBody':
    'An API key gives the same access as your account: whoever holds it can read and change the schedule. It is shown only once, when you create it, and it expires on its own. Never paste it into a chat, a commit or a screenshot.',
  'settings.apiKeys.nameLabel': 'Key name',
  'settings.apiKeys.namePlaceholder': 'Claude Code on my laptop',
  'settings.apiKeys.nameHint': 'One key per agent. The name tells you later which one to revoke.',
  'settings.apiKeys.expiryLabel': 'Expires after',
  'settings.apiKeys.expiry30Label': '30 days',
  'settings.apiKeys.expiry30Hint': 'Shortest. Good for a test or a one-off agent.',
  'settings.apiKeys.expiry90Label': '90 days',
  'settings.apiKeys.expiry90Hint':
    'Recommended. Long enough for daily use, short enough to limit the damage if the key leaks.',
  'settings.apiKeys.expiry365Label': '365 days',
  'settings.apiKeys.expiry365Hint': 'Longest. Use it only for an agent that runs every day.',
  'settings.apiKeys.creating': 'Creating…',
  'settings.apiKeys.create': 'Create key',
  'settings.apiKeys.listTitle': 'Your keys',
  'settings.apiKeys.refresh': 'Refresh',
  'settings.apiKeys.listLoading': 'Checking your keys',
  'settings.apiKeys.retry': 'Try again',
  'settings.apiKeys.empty': 'No API keys yet. Create one above to connect an agent.',
  'settings.apiKeys.created': 'Created {date}',
  'settings.apiKeys.expiredNote': 'Expired. This key no longer works.',
  'settings.apiKeys.revokeAria': 'Revoke {name}',
  'settings.apiKeys.revokeAll': 'Revoke all keys',
  'settings.apiKeys.revokeAllBody':
    'Use this only when you do not know which key leaked. It cuts off every agent at once, so each one needs a new key afterwards.',
  'settings.apiKeys.revokeTitle': 'Revoke API key?',
  'settings.apiKeys.revokeDescription': '{name} will stop working immediately.',
  'settings.apiKeys.thisKey': 'This key',
  'settings.apiKeys.revokeConfirm': 'Revoke key',
  'settings.apiKeys.revokeAllTitle': 'Revoke all API keys?',
  'settings.apiKeys.revokeAllDescription':
    'Every key will stop working immediately. All the agents using them lose access at the same time and each one needs a new key.',
  'settings.apiKeys.revokeAllConfirm': 'Revoke all keys',
  'settings.apiKeys.loadError': 'API keys could not be loaded.',
  'settings.apiKeys.createError': 'Failed to create key',
  'settings.apiKeys.revokeError': 'Failed to revoke key',
  'settings.apiKeys.revokeAllError': 'Failed to revoke all keys',
  'settings.apiKeys.revoked': 'Key revoked',
  'settings.apiKeys.revokedAll': 'All API keys revoked',
  'settings.apiKeys.copied': 'Copied',
  'settings.apiKeys.copyError': 'Could not copy the key',

  // Settings: key status
  'settings.keys.noExpiry': 'No expiry date',
  'settings.keys.expired': 'Expired',
  'settings.keys.expiresInOne': 'Expires in 1 day',
  'settings.keys.expiresIn': 'Expires in {days} days',
  'settings.keys.neverUsed': 'Never used',
  'settings.keys.lastUsedToday': 'Last used today',
  'settings.keys.lastUsedOne': 'Last used 1 day ago',
  'settings.keys.lastUsed': 'Last used {days} days ago',

  // Settings: connection guide
  'settings.guide.title': 'Connect an agent',
  'settings.guide.intro':
    'An agent is a program like Claude Code that reads and changes your schedule for you. It needs an API key to know which schedule is yours. Let your agent do the setup, or follow the steps yourself.',
  'settings.guide.manualTitle': 'Connect it to your agent',
  'settings.guide.manualIntro': 'Prefer to set it up yourself? Do these steps in order, by hand.',
  'settings.guide.stepLabel': 'Step {step}: {title}',
  'settings.guide.step1Title': 'Create the key',
  'settings.guide.step1Body':
    'Scroll up to **Create a key**, give it a name that says where the key will live (for example `Claude Code on my laptop`) and choose how long it should last.',
  'settings.guide.step1Why':
    'Why: one key per agent. If two programs share a key, revoking it stops both, and you cannot tell which one was the problem.',
  'settings.guide.step2Title': 'Copy the key right away',
  'settings.guide.step2Body':
    'The new key appears in a box at the top of this page with a copy button. Copy it now.',
  'settings.guide.step2Why':
    'Why: the app shows the key only once, at the moment you create it. Nobody, not even support, can show it again later. If you lose it, you create a new one.',
  'settings.guide.step3Title': 'Save it where the agent reads it',
  'settings.guide.step3Body':
    'In the project where the agent runs, create a file called `.mcp.json` with this content, and paste the key you just copied:',
  'settings.guide.step3Why':
    'Why: the agent reads its settings from that file when it starts. It is a local file on your own machine, and this project already ignores it in git, so it never goes to the repository.',
  'settings.guide.step3Url':
    '`MCP_API_URL` is the address of this app. The endpoints live under `https://<your-domain>/api` and the server adds that part by itself, so the address above goes without `/api`.',
  'settings.guide.step3Other':
    'If the agent runs on another computer, replace the address with your own domain, for example `https://your-domain.example`.',
  'settings.guide.step3Secret':
    'Never put the key in the code, in a commit, in a chat or in a screenshot. A key in a chat is a key in a place many people can read.',
  'settings.guide.step4Title': 'Build and start the server',
  'settings.guide.step4Body': 'From the root of this repository, run:',
  'settings.guide.step4Why':
    'Why: the agent needs this server to translate what you ask into calls to your schedule. It is not published with the repository on purpose, so you compile it yourself and it always runs code you have seen.',
  'settings.guide.step5Title': 'Try it and check it worked',
  'settings.guide.step5Body':
    'Ask the agent something about the schedule, for example ~"who works on Friday?"~, then come back to this page and press **Refresh** in the key list.',
  'settings.guide.step5Why':
    'Why: the key records when it was last used. If you see **Last used…** instead of **Never used**, the agent is connected correctly.',
  'settings.guide.step6Title': 'If the key leaks',
  'settings.guide.step6Body':
    'Revoke that key with the bin icon next to it and create a new one. If you cannot tell which key leaked, use **Revoke all keys**: every agent stops at the same time and you give each one a fresh key.',
  'settings.guide.step6Why':
    'Why: a leaked key works like a password that someone else has. Revoking it takes the access away immediately, and the key expires on its own after a while as a second safety net.',

  // Settings: the prompt pasted into the agent (the prompt itself stays in English)
  'settings.prompt.title': 'Let your agent set it up',
  'settings.prompt.intro':
    'Do not want to follow the steps yourself? Copy the text below and paste it into your agent. The agent does the setup for you.',
  'settings.prompt.label': 'Prompt to paste in your agent',
  'settings.prompt.copyAria': 'Copy the setup prompt',
  'settings.prompt.copied': 'Copied',
  'settings.prompt.copyError': 'Could not copy the prompt. Select the text and copy it by hand.',
  'settings.prompt.canDoTitle': 'What you can do once it works',
  'settings.prompt.canDo1': 'See the shifts of a day, a week or one employee',
  'settings.prompt.canDo2': 'Create a shift',
  'settings.prompt.canDo3': 'Move a shift to another time or another person',
  'settings.prompt.canDo4': 'Delete a shift',
  'settings.prompt.canDo5': 'Check who covers a time range',
  'settings.prompt.canDo6': 'List the employees',
  'settings.prompt.tryTitle': 'How to try it',
  'settings.prompt.try1': 'Ask who works on Friday',
  'settings.prompt.try2': 'Ask it to create a test shift, then ask it to delete that same shift',
  'settings.prompt.try3': 'Come back to this page, press Refresh and check that the key says it was used',
  'settings.prompt.footnote':
    'The agent has the same access to the schedule as your account. That is why the key expires on its own and why you can revoke it from this page.',

  // Settings: logo row
  'settings.icons.worksWith': 'Works with',

  // Auth
  'auth.signIn': 'Sign in',
  'auth.signingIn': 'Signing in…',
  'auth.email': 'Email',
  'auth.password': 'Password',
  'auth.name': 'Name',
  'auth.namePlaceholder': 'Your name',
  'auth.passwordPlaceholder': 'Minimum 8 characters',
  'auth.or': 'or',
  'auth.continueWithGoogle': 'Continue with Google',
  'auth.continueWithGitHub': 'Continue with GitHub',
  'auth.consentPrefix': 'I have read and accept the ',
  'auth.consentLink': 'privacy notice',
  'auth.consentSuffix': '.',
  'auth.consentRequired': 'Please accept the privacy notice to continue.',
  'auth.consentError': 'Could not record your consent. Try again.',
  'auth.login.title': 'Sign in',
  'auth.login.subtitle': 'Plan who works and when, and keep your team\'s schedule in one place.',
  'auth.login.footerQuestion': 'Don\'t have an account? ',
  'auth.login.footerLink': 'Create one',
  'auth.login.oauthReady': 'Google and GitHub will sign you in.',
  'auth.login.oauthNeedsConsent': 'Accept the privacy notice above to continue with Google or GitHub.',
  'auth.invalidCredentials': 'Invalid email or password',
  'auth.signInFailed': 'Sign in failed. Try again.',
  'auth.register.title': 'Create account',
  'auth.register.subtitle':
    'Set up your team\'s shift schedule: add employees, plan their hours and track time off.',
  'auth.register.footerQuestion': 'Already have an account? ',
  'auth.register.footerLink': 'Sign in',
  'auth.register.oauthReady': 'Google and GitHub will create your account with the privacy notice accepted.',
  'auth.register.oauthNeedsConsent': 'Accept the privacy notice below to continue with Google or GitHub.',
  'auth.register.creating': 'Creating account…',
  'auth.register.submit': 'Create account',
  'auth.registrationFailed': 'Registration failed',
  'auth.signInAfterRegistrationFailed': 'Sign in failed after registration',
  'auth.acceptPrivacy.title': 'Accept the privacy notice',
  'auth.acceptPrivacy.subtitle':
    'Your account has not been created yet. Read the privacy notice, accept it and continue with the same provider you used to sign in.',
  'auth.acceptPrivacy.footerPrefix': 'You can read the full ',
  'auth.acceptPrivacy.footerLink': 'privacy notice',
  'auth.acceptPrivacy.footerSuffix': ' before accepting.',
  'auth.acceptPrivacy.oauthReady': 'Continue with the provider you used to sign in.',
  'auth.acceptPrivacy.oauthNeedsConsent': 'Accept the privacy notice to create your account.',

  // Privacy notice
  'privacy.title': 'Privacy notice',
  'privacy.intro':
    'This notice explains, in plain language, what personal data this application handles, for what purpose, for how long and who it reaches. It covers the business accounts of the service and the employees whose data those accounts manage.',
  'privacy.controllerTitle': 'Who is the data controller',
  'privacy.controllerBody':
    'The data controller is **[RESPONSABLE LEGAL]**. The legal name, tax ID and contact details will be published in this section before the service opens to the public.',
  'privacy.dataTitle': 'What data we process and why',
  'privacy.dataIntro': 'We only process the data the service needs to work.',
  'privacy.dataAccount':
    '**Your business account.** When you create an account we process your name, your email address and the password you choose, stored only as an irreversible hash, plus the name and time zone of your business. Purpose: to create the account, sign you in and link the schedule to your business. Legal basis: the contract with you (GDPR art. 6.1.b).',
  'privacy.dataEmployees':
    '**Your employees\' data.** When you add an employee to the schedule we process their full name and, optionally, their email address, phone number, birthday and start date, together with the shifts and absences assigned to them: dates, times, type of absence and any notes you add. Purpose: to build and show the work schedule; the birthday is marked on the schedule every year. Legal basis: the legitimate interest of the business in organizing its staff schedule (GDPR art. 6.1.f). If you manage a business account, informing your employees and having a valid reason to add them is your responsibility. One of the absence types marks the absence as a sick leave; that data will be processed under the legal basis defined in the pending legal review.',
  'privacy.retentionTitle': 'How long we keep it',
  'privacy.retentionBody':
    'Account data is kept while the account is active. When an employee is deleted, their record is anonymized immediately: email, phone number and birthday are erased. Historical shifts are kept and stay linked to that anonymized record, so the schedule history and the PDF exports remain readable. Only the name remains attached to those past shifts.',
  'privacy.recipientsTitle': 'Who receives your data',
  'privacy.recipientsBody':
    'The data is stored with the providers needed to run this service: the application hosting provider and the database provider. If you sign in with Google or GitHub, that provider takes part in identifying you. We do not sell personal data, we do not share it for advertising, and we do not use analytics or marketing trackers.',
  'privacy.rightsTitle': 'Your rights',
  'privacy.rightsBody':
    'You have the right to access your data, rectify it, delete it, restrict its processing, object to it and request its portability. To exercise any of these rights, write to **[EMAIL DE CONTACTO]**. There is no self-service for these requests yet: they are handled manually and answered by email, normally within a month. Employees who appear in a schedule can use the same address.',
  'privacy.complaintTitle': 'Complaint to the AEPD',
  'privacy.complaintPrefix':
    'If you believe your data has not been handled correctly, you can file a complaint with the Spanish data protection authority, the Agencia Española de Protección de Datos (AEPD), at ',
  'privacy.complaintSuffix': '.',
  'privacy.draftTitle': 'Draft notice, pending legal review',
  'privacy.draftBody':
    'This text has not been reviewed by a lawyer. Before the service opens to the public, the placeholders between brackets ([RESPONSABLE LEGAL] and [EMAIL DE CONTACTO]) must be replaced with real values and the notice must pass a legal review. Until then, treat this page as a draft.',
  'privacy.healthBody':
    '**Health data.** The sick_leave shift type reveals that an employee is on sick leave, which is health data under GDPR art. 9. Before the service opens to the public, the legal basis of GDPR art. 9.2 (explicit consent from the employee or applicable labor law) must be decided, restricted access must be documented and it must be confirmed that no clinical detail is stored.',
  'privacy.lastUpdated': 'Last updated: 24 November 2026.',
  'privacy.backPrefix': 'Back to ',
  'privacy.backLink': 'sign in',
  'privacy.backSuffix': '.',
}
