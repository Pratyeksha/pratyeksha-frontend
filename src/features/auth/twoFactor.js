// True when a login endpoint answered with a second-factor challenge instead of a session.
export const isTwoFactorChallenge = (d) => !!(d && d.challengeToken && (d.twoFactorRequired || d.twoFactorSetupRequired));
