import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/login',
  },
});

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/transactions/:path*',
    '/budgets/:path*',
    '/ai-advisor/:path*',
    '/admin/:path*'
  ]
};
