import { NextResponse } from 'next/server';
import { sessionService } from '../../../../platform/auth/session.service';
import { userRepository } from '../../../../repositories/user.repository';

export async function GET() {
  try {
    const session = await sessionService.getSession();
    if (!session) {
      return NextResponse.json({ user: null });
    }

    const user = await userRepository.getUserById(session.userId);
    if (!user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.displayName,
        email: user.email,
        role: user.role.toLowerCase()
      },
      token: session.id
    });
  } catch (err) {
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
