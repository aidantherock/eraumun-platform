import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import PublicLayout from './layouts/PublicLayout'

// Auth pages
import Login from './pages/public/Login'
import Register from './pages/public/Register'
import ResetPassword from './pages/public/ResetPassword'
import UpdatePassword from './pages/public/UpdatePassword'
import Pending from './pages/public/Pending'

// Public pages
import Home from './pages/public/Home'
import About from './pages/public/About'
import Conferences from './pages/public/Conferences'
import Support from './pages/public/Support'
import News from './pages/public/News'
import Contact from './pages/public/Contact'
import ErnieCrisis from './pages/public/ErnieCrisis'
import NotFound from './pages/public/NotFound'
import InviteAccept from './pages/public/InviteAccept'
import NewsPost from './pages/public/NewsPost'

// Legal pages
import Privacy from './pages/public/Privacy'
import Terms from './pages/public/Terms'
import Cookies from './pages/public/Cookies'

// Portal pages
import PortalLayout from './layouts/PortalLayout'
import PortalHome from './pages/portal/Home'
import PortalEvents from './pages/portal/Events'
import PortalContact from './pages/portal/Contact'
import PortalProfile from './pages/portal/Profile'
import EventDetail from './pages/portal/EventDetail'

// Admin pages
import AdminLayout from './layouts/AdminLayout'
import AdminHome from './pages/admin/Home'
import AdminUsers from './pages/admin/Users'
import AdminAnnouncements from './pages/admin/Announcements'
import AdminSponsors from './pages/admin/Sponsors'
import AdminForms from './pages/admin/Forms'
import AdminEvents from './pages/admin/Events'
import AdminEmails from './pages/admin/Emails'
import AdminNews from './pages/admin/News'
import AdminAwards from './pages/admin/Awards'

// Event Admin pages
import EventAdminLayout from './layouts/EventAdminLayout'
import EventAdminHome from './pages/admin/event/Home'
import EventAdminCommittees from './pages/admin/event/Committees'
import EventAdminRoles from './pages/admin/event/Roles'
import EventAdminSubmissions from './pages/admin/event/Submissions'
import EventAdminAttendees from './pages/admin/event/Attendees'
import EventAdminSchedule from './pages/admin/event/Schedule'
import EventAdminFiles from './pages/admin/event/Files'
import EventAdminGuestDelegates from './pages/admin/event/GuestDelegates'
import EventAdminExport from './pages/admin/event/Export'
import EventAdminAwards from './pages/admin/event/Awards'

// Committee pages
import CommitteeLayout from './layouts/CommitteeLayout'
import CommitteeHome from './pages/portal/committee/Home'
import CommitteeSubmissions from './pages/portal/committee/Submissions'
import CommitteeVoting from './pages/portal/committee/Voting'
import CommitteeMessages from './pages/portal/committee/Messages'
import CommitteeResolutions from './pages/portal/committee/Resolutions'
import CommitteeFloor from './pages/portal/committee/Floor'

function App() {
  return (
    <AuthProvider>
      <Routes>

        {/* ── Auth routes (no layout) ── */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/update-password" element={<UpdatePassword />} />
        <Route path="/pending" element={<Pending />} />

        {/* ── Public site routes ── */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/conferences" element={<Conferences />} />
          <Route path="/support" element={<Support />} />
          <Route path="/news" element={<News />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/ernie-crisis" element={<ErnieCrisis />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/cookies" element={<Cookies />} />
          <Route path="*" element={<NotFound />} />
          <Route path="/invite/:token" element={<InviteAccept />} />
          <Route path="/news/:slug" element={<NewsPost />} />
        </Route>

        {/* ── Portal routes ── */}
        <Route path="/portal" element={
          <ProtectedRoute>
            <PortalLayout />
          </ProtectedRoute>
        }>
          <Route index element={<PortalHome />} />
          <Route path="events" element={<PortalEvents />} />
          <Route path="contact" element={<PortalContact />} />
          <Route path="profile" element={<PortalProfile />} />
          <Route path="events/:eventId" element={<EventDetail />} />
        </Route>

        {/* ── Committee workspace routes ── */}
        <Route path="/portal/committee/:committeeId" element={
          <ProtectedRoute>
            <CommitteeLayout />
          </ProtectedRoute>
        }>
          <Route index element={<CommitteeHome />} />
          <Route path="submissions" element={<CommitteeSubmissions />} />
          <Route path="voting" element={<CommitteeVoting />} />
          <Route path="messages" element={<CommitteeMessages />} />
          <Route path="resolutions" element={<CommitteeResolutions />} />
          <Route path="floor" element={<CommitteeFloor />} />
        </Route>

        {/* ── Global Admin routes ── */}
        <Route path="/admin" element={
          <ProtectedRoute requireLevel={80}>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminHome />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="announcements" element={<AdminAnnouncements />} />
          <Route path="sponsors" element={<AdminSponsors />} />
          <Route path="forms" element={<AdminForms />} />
          <Route path="events" element={<AdminEvents />} />
          <Route path="emails" element={<AdminEmails />} />
          <Route path="news" element={<AdminNews />} />
          <Route path="awards" element={<AdminAwards />} />
        </Route>

        {/* ── Event Admin routes ── */}
        <Route path="/admin/event/:eventId" element={
          <ProtectedRoute requireLevel={70}>
            <EventAdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<EventAdminHome />} />
          <Route path="committees" element={<EventAdminCommittees />} />
          <Route path="roles" element={<EventAdminRoles />} />
          <Route path="submissions" element={<EventAdminSubmissions />} />
          <Route path="attendees" element={<EventAdminAttendees />} />
          <Route path="schedule" element={<EventAdminSchedule />} />
          <Route path="files" element={<EventAdminFiles />} />
          <Route path="delegates" element={<EventAdminGuestDelegates />} />
          <Route path="export" element={<EventAdminExport />} />
          <Route path="awards" element={<EventAdminAwards />} />
        </Route>

      </Routes>
    </AuthProvider>
  )
}

export default App