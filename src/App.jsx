import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

// Layouts
import PublicLayout from './layouts/PublicLayout'
import PortalLayout from './layouts/PortalLayout'
import AdminLayout from './layouts/AdminLayout'
import EventAdminLayout from './layouts/EventAdminLayout'
import CommitteeLayout from './layouts/CommitteeLayout'

// Public pages
import Home from './pages/public/Home'
import About from './pages/public/About'
import Conferences from './pages/public/Conferences'
import Support from './pages/public/Support'
import News from './pages/public/News'
import Contact from './pages/public/Contact'
import ErnieCrisis from './pages/public/ErnieCrisis'
import Privacy from './pages/public/Privacy'
import Terms from './pages/public/Terms'
import Cookies from './pages/public/Cookies'
import NotFound from './pages/public/NotFound'
import Gallery from './pages/public/Gallery'
import NewsPost from './pages/public/NewsPost'
import Login from './pages/public/Login'
import Register from './pages/public/Register'
import Pending from './pages/public/Pending'
import InviteAccept from './pages/public/InviteAccept'
import Demo from './pages/public/Demo'
import ConferenceRecap from './pages/public/ConferenceRecap'
import DelegationInviteAccept from './pages/public/DelegationInviteAccept'

// Portal pages
import PortalHome from './pages/portal/Home'
import PortalEvents from './pages/portal/Events'
import PortalContact from './pages/portal/Contact'
import PortalProfile from './pages/portal/Profile'
import EventDetail from './pages/portal/EventDetail'
import Directory from './pages/portal/Directory'
import MemberProfile from './pages/portal/MemberProfile'
import StaffControlRoom from './pages/portal/StaffControlRoom'
import EventChecklist from './pages/portal/EventChecklist'
import DelegationDashboard from './pages/portal/DelegationDashboard'

// Committee workspace
import CommitteeHome from './pages/portal/committee/Home'
import CommitteeSubmissions from './pages/portal/committee/Submissions'
import CommitteeVoting from './pages/portal/committee/Voting'
import CommitteeMessages from './pages/portal/committee/Messages'
import CommitteeResolutions from './pages/portal/committee/Resolutions'
import CommitteeFloor from './pages/portal/committee/Floor'
import CommitteeCrisis from './pages/portal/committee/Crisis'
import CrisisNotes from './pages/portal/committee/CrisisNotes'
import CommitteeAwards from './pages/portal/committee/Awards'
import CommitteeResources from './pages/portal/committee/Resources'
import ConferenceMode from './pages/portal/committee/ConferenceMode'

// Admin pages
import AdminHome from './pages/admin/Home'
import AdminUsers from './pages/admin/Users'
import AdminAnnouncements from './pages/admin/Announcements'
import AdminSponsors from './pages/admin/Sponsors'
import AdminForms from './pages/admin/Forms'
import AdminEvents from './pages/admin/Events'
import AdminEmails from './pages/admin/Emails'
import AdminNews from './pages/admin/News'
import AdminAwards from './pages/admin/Awards'
import AdminGallery from './pages/admin/Gallery'

// Event Admin pages
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
import EventAdminChecklist from './pages/admin/event/Checklist'

export default function App() {
  return (
    <AuthProvider>
        <Routes>

          {/* ── Public routes ── */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/conferences" element={<Conferences />} />
            <Route path="/support" element={<Support />} />
            <Route path="/news" element={<News />} />
            <Route path="/news/:slug" element={<NewsPost />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/ernie-crisis" element={<ErnieCrisis />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/cookies" element={<Cookies />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/demo" element={<Demo />} />
            <Route path="/conferences/:eventId" element={<ConferenceRecap />} />
            <Route path="/invite/delegation/:token" element={<DelegationInviteAccept />} />
          </Route>

          {/* ── Auth routes ── */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/pending" element={<Pending />} />
          <Route path="/invite/:token" element={<InviteAccept />} />

          {/* ── Portal routes ── */}
          <Route path="/portal" element={
            <ProtectedRoute>
              <PortalLayout />
            </ProtectedRoute>
          }>
            <Route index element={<PortalHome />} />
            <Route path="events" element={<PortalEvents />} />
            <Route path="events/:eventId" element={<EventDetail />} />
            <Route path="events/:eventId/checklist" element={<EventChecklist />} />
            <Route path="contact" element={<PortalContact />} />
            <Route path="profile" element={<PortalProfile />} />
            <Route path="directory" element={<Directory />} />
            <Route path="directory/:memberId" element={<MemberProfile />} />
            <Route path="control-room/:eventId" element={<StaffControlRoom />} />
            <Route path="delegation/:eventId" element={<DelegationDashboard />} />
          </Route>

          {/* ── Conference mode (standalone, no portal layout) ── */}
          <Route path="/portal/committee/:committeeId/conference" element={
            <ProtectedRoute>
              <ConferenceMode />
            </ProtectedRoute>
          } />

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
            <Route path="crisis" element={<CommitteeCrisis />} />
            <Route path="notes" element={<CrisisNotes />} />
            <Route path="awards" element={<CommitteeAwards />} />
            <Route path="resources" element={<CommitteeResources />} />
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
            <Route path="gallery" element={<AdminGallery />} />
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
            <Route path="checklist" element={<EventAdminChecklist />} />
          </Route>

          {/* ── 404 ── */}
          <Route path="*" element={<NotFound />} />

        </Routes>
    </AuthProvider>
  )
}