/**
 * Fuse tab header — same candy pill placement as Sleep.
 */

import { TabHeaderShell } from '@/src/components/TabHeaderShell';
import { mainScreens } from '@/src/theme/mainScreensTheme';

export function FusionTabHeader() {
  return <TabHeaderShell backgroundColor={mainScreens.fuse.bg} />;
}
