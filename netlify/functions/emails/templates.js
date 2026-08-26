const BRAND = {
  navy: '#1e3a6e',
  gold: '#b8963e',
  lightGold: '#d4af62',
  lightNavy: '#e8eef7',
}

function base({ title, preheader, body }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; color: #333; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 32px 16px; }
    .card { background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: ${BRAND.navy}; padding: 32px; text-align: center; }
    .header img { height: 48px; }
    .header-bar { height: 4px; background: ${BRAND.gold}; }
    .body { padding: 40px 32px; }
    .body h1 { font-size: 22px; font-weight: 700; color: ${BRAND.navy}; margin-bottom: 16px; }
    .body p { font-size: 15px; line-height: 1.6; color: #444; margin-bottom: 16px; }
    .btn { display: inline-block; background: ${BRAND.navy}; color: #fff !important; font-size: 14px; font-weight: 600; padding: 12px 28px; border-radius: 6px; text-decoration: none; margin: 8px 0; }
    .btn-gold { background: ${BRAND.gold}; color: ${BRAND.navy} !important; }
    .divider { height: 1px; background: #eee; margin: 24px 0; }
    .info-box { background: ${BRAND.lightNavy}; border-left: 4px solid ${BRAND.navy}; border-radius: 4px; padding: 16px; margin: 16px 0; }
    .info-box p { margin: 0; font-size: 14px; }
    .footer { padding: 24px 32px; text-align: center; }
    .footer p { font-size: 12px; color: #999; line-height: 1.6; }
    .footer a { color: ${BRAND.navy}; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <img src="https://eraumun.com/logo-horizontal.jpg" alt="ERAU-MUN" />
      </div>
      <div class="header-bar"></div>
      <div class="body">
        ${body}
      </div>
    </div>
    <div class="footer">
      <p>
        &copy; ${new Date().getFullYear()} Embry-Riddle Model United Nations &bull; Daytona Beach, FL<br>
        <a href="https://eraumun.com">eraumun.com</a> &bull;
        <a href="https://eraumun.com/privacy">Privacy Policy</a> &bull;
        <a href="https://eraumun.com/terms">Terms of Service</a>
      </p>
      <p style="margin-top:8px;">This is a transactional email from ERAU-MUN. You are receiving this because you have an account on eraumun.com.</p>
    </div>
  </div>
</body>
</html>`
}

// ── Individual Templates ──────────────────────────────────────

function welcome({ firstName }) {
  return {
    subject: 'Welcome to ERAU-MUN — Your account is pending approval',
    html: base({
      title: 'Welcome to ERAU-MUN',
      body: `
        <h1>Welcome, ${firstName}!</h1>
        <p>Thank you for registering with Embry-Riddle Model United Nations. Your account has been created and is currently <strong>pending approval</strong> by an administrator.</p>
        <div class="info-box">
          <p>You will receive an email as soon as your account has been reviewed. This typically happens within 24-48 hours.</p>
        </div>
        <p>In the meantime, feel free to explore our public site to learn more about ERAU-MUN.</p>
        <a href="https://eraumun.com" class="btn">Visit ERAU-MUN</a>
        <div class="divider"></div>
        <p style="font-size:13px;color:#666;">If you did not create this account, please contact us at <a href="mailto:info@eraumun.com">info@eraumun.com</a>.</p>
      `
    })
  }
}

function accountApproved({ firstName }) {
  return {
    subject: 'Your ERAU-MUN account has been approved',
    html: base({
      title: 'Account Approved',
      body: `
        <h1>You're in, ${firstName}!</h1>
        <p>Great news — your ERAU-MUN account has been approved. You now have full access to the member portal.</p>
        <div class="info-box">
          <p>Log in to access your dashboard, view events, and get involved with the club.</p>
        </div>
        <a href="https://eraumun.com/login" class="btn btn-gold">Access the Portal</a>
        <div class="divider"></div>
        <p>Here's what you can do in the portal:</p>
        <ul style="margin:0 0 16px 20px;font-size:14px;color:#444;line-height:1.8;">
          <li>View and sign up for upcoming events</li>
          <li>Access your committee workspace</li>
          <li>Stay updated with club announcements</li>
          <li>Connect with other delegates</li>
        </ul>
      `
    })
  }
}

function accountInvited({ inviterName, roleName, inviteUrl }) {
  return {
    subject: `You've been invited to join ERAU-MUN`,
    html: base({
      title: 'Invitation to ERAU-MUN',
      body: `
        <h1>You've been invited!</h1>
        <p><strong>${inviterName}</strong> has invited you to join the ERAU Model United Nations platform${roleName ? ` as <strong>${roleName}</strong>` : ''}.</p>
        <p>Click the button below to create your account and get started. This invitation expires in 90 days.</p>
        <a href="${inviteUrl}" class="btn btn-gold">Accept Invitation</a>
        <div class="divider"></div>
        <p style="font-size:13px;color:#666;">If you were not expecting this invitation, you can safely ignore this email.</p>
      `
    })
  }
}

function pendingApprovalReminder({ count, portalUrl }) {
  return {
    subject: `${count} user${count !== 1 ? 's' : ''} pending approval on ERAU-MUN`,
    html: base({
      title: 'Pending Approvals',
      body: `
        <h1>Pending Approvals</h1>
        <p>There ${count !== 1 ? 'are' : 'is'} currently <strong>${count} user${count !== 1 ? 's' : ''}</strong> waiting for account approval on the ERAU-MUN platform.</p>
        <a href="${portalUrl}/admin/users" class="btn">Review Users</a>
      `
    })
  }
}

function inviteExpiring({ email, daysLeft, inviteUrl }) {
  return {
    subject: `Your ERAU-MUN invitation expires in ${daysLeft} days`,
    html: base({
      title: 'Invitation Expiring Soon',
      body: `
        <h1>Your invitation is expiring soon</h1>
        <p>Your invitation to join ERAU-MUN will expire in <strong>${daysLeft} days</strong>.</p>
        <p>Click below to accept your invitation before it expires.</p>
        <a href="${inviteUrl}" class="btn btn-gold">Accept Invitation</a>
      `
    })
  }
}

function eventReminder({ firstName, eventName, eventDate, eventTime, eventLocation, portalUrl }) {
  return {
    subject: `Reminder: ${eventName} is tomorrow`,
    html: base({
      title: 'Event Reminder',
      body: `
        <h1>Event Reminder</h1>
        <p>Hi ${firstName}, this is a reminder that <strong>${eventName}</strong> is coming up tomorrow.</p>
        <div class="info-box">
          <p><strong>Date:</strong> ${eventDate}</p>
          ${eventTime ? `<p><strong>Time:</strong> ${eventTime}</p>` : ''}
          ${eventLocation ? `<p><strong>Location:</strong> ${eventLocation}</p>` : ''}
        </div>
        <a href="${portalUrl}/portal/events" class="btn">View Event Details</a>
      `
    })
  }
}

function postConferenceFeedback({ firstName, eventName, feedbackUrl }) {
  return {
    subject: `How was ${eventName}? Share your feedback`,
    html: base({
      title: 'Post-Conference Feedback',
      body: `
        <h1>Thanks for attending ${eventName}!</h1>
        <p>Hi ${firstName}, we hope you had a great experience at <strong>${eventName}</strong>.</p>
        <p>We'd love to hear your feedback to help us improve future events. It only takes a few minutes.</p>
        <a href="${feedbackUrl}" class="btn btn-gold">Share Feedback</a>
        <div class="divider"></div>
        <p style="font-size:13px;color:#666;">Your feedback is valuable to us and helps make ERAU-MUN better for everyone.</p>
      `
    })
  }
}

function onboardingDay3({ firstName }) {
  return {
    subject: 'Getting started with ERAU-MUN',
    html: base({
      title: 'Getting Started',
      body: `
        <h1>Welcome aboard, ${firstName}!</h1>
        <p>You joined ERAU-MUN a few days ago — we wanted to make sure you're getting the most out of your membership.</p>
        <p>Here are a few things to check out:</p>
        <ul style="margin:0 0 16px 20px;font-size:14px;color:#444;line-height:2;">
          <li><strong>Events</strong> — Sign up for upcoming conferences and meetings</li>
          <li><strong>Dashboard</strong> — Stay updated with club announcements</li>
          <li><strong>Profile</strong> — Complete your profile and add your social links</li>
          <li><strong>Contact</strong> — Reach out to the executive board with any questions</li>
        </ul>
        <a href="https://eraumun.com/portal" class="btn">Go to Portal</a>
        <div class="divider"></div>
        <p>Have questions? Reply to this email or contact us at <a href="mailto:info@eraumun.com">info@eraumun.com</a>.</p>
      `
    })
  }
}

function ernieCrisisRegistration({ firstName, registrationType, teamName }) {
  return {
    subject: 'Ernie Crisis Simulation — Registration Received',
    html: base({
      title: 'Registration Received',
      body: `
        <h1>Thanks for registering, ${firstName}!</h1>
        <p>We have received your ${registrationType === 'team' ? 'team ' : ''}registration for the <strong>Ernie Crisis Simulation</strong> hosted by ERAU Model United Nations.</p>
        ${teamName ? `<div class="info-box"><p><strong>Team:</strong> ${teamName}</p></div>` : ''}
        <p>We will be in touch with confirmation details, event information, and next steps closer to the event date.</p>
        <a href="https://eraumun.com/ernie-crisis" class="btn">View Event Details</a>
        <div class="divider"></div>
        <p>Questions? Contact us at <a href="mailto:info@eraumun.com">info@eraumun.com</a>.</p>
      `
    })
  }
}

function ernieCrisisWaitlisted({ firstName }) {
  return {
    subject: 'Ernie Crisis Simulation — You are on the waitlist',
    html: base({
      title: 'Waitlisted',
      body: `
        <h1>You're on the waitlist, ${firstName}</h1>
        <p>Thank you for registering for the Ernie Crisis Simulation. Unfortunately, we have reached capacity for this event.</p>
        <p>You have been added to the <strong>waitlist</strong>. We will contact you if a spot becomes available.</p>
        <div class="info-box">
          <p>We appreciate your interest and hope to see you at a future ERAU-MUN event.</p>
        </div>
      `
    })
  }
}

function ernieCrisisConfirmed({ firstName, eventDate, eventLocation }) {
  return {
    subject: 'Ernie Crisis Simulation — You are confirmed!',
    html: base({
      title: 'Registration Confirmed',
      body: `
        <h1>You're confirmed, ${firstName}!</h1>
        <p>Your registration for the <strong>Ernie Crisis Simulation</strong> has been confirmed.</p>
        <div class="info-box">
          ${eventDate ? `<p><strong>Date:</strong> ${eventDate}</p>` : ''}
          ${eventLocation ? `<p><strong>Location:</strong> ${eventLocation}</p>` : ''}
        </div>
        <p>We look forward to seeing you there. More details will be sent closer to the event.</p>
        <a href="https://eraumun.com/ernie-crisis" class="btn btn-gold">View Event Details</a>
      `
    })
  }
}

function massEmail({ subject, content, senderName }) {
  return {
    subject,
    html: base({
      title: subject,
      body: `
        <h1>${subject}</h1>
        ${content.split('\n').map(p => p.trim() ? `<p>${p}</p>` : '').join('')}
        <div class="divider"></div>
        <p style="font-size:13px;color:#666;">This message was sent by ${senderName} on behalf of ERAU Model United Nations.</p>
        <p style="font-size:13px;color:#666;">To manage your notification preferences, visit your <a href="https://eraumun.com/portal/profile">profile settings</a>.</p>
      `
    })
  }
}

function newReport({ formType, submittedBy, message, isAnonymous }) {
  return {
    subject: `New ${formType.replace(/_/g, ' ')} submitted on ERAU-MUN`,
    html: base({
      title: 'New Form Submission',
      body: `
        <h1>New ${formType.replace(/_/g, ' ')}</h1>
        <p><strong>Submitted by:</strong> ${isAnonymous ? 'Anonymous' : submittedBy}</p>
        <div class="info-box">
          <p>${message}</p>
        </div>
        <a href="https://eraumun.com/admin/forms" class="btn">View in Admin Panel</a>
      `
    })
  }
}

module.exports = {
  welcome,
  accountApproved,
  accountInvited,
  pendingApprovalReminder,
  inviteExpiring,
  eventReminder,
  postConferenceFeedback,
  onboardingDay3,
  ernieCrisisRegistration,
  ernieCrisisWaitlisted,
  ernieCrisisConfirmed,
  massEmail,
  newReport,
}