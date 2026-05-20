import { OutlinedSvgLabel } from '@/src/components/OutlinedSvgLabel';
import { mainScreens } from '@/src/theme/mainScreensTheme';
import { createAppStyles } from '@/src/theme/createAppStyles';

const FUSE_CTA_FONT = 36;

export type FusionFuseCtaLabelProps = {
  muted?: boolean;
};

export function FusionFuseCtaLabel({ muted = false }: FusionFuseCtaLabelProps) {
  return (
    <OutlinedSvgLabel
      text="Fuse"
      fontSize={FUSE_CTA_FONT}
      height={48}
      baselineY={36}
      strokeWidth={1.7}
      strokeColor={
        muted ? mainScreens.fuse.disabledButtonTextBorder : mainScreens.fuse.specialTextBorder
      }
      fillColor={muted ? mainScreens.fuse.disabledButtonText : mainScreens.shared.onPrimary}
      style={styles.fuseCtaSvgWrap}
      defaultWidth={168}
      minWidth={120}
    />
  );
}

const styles = createAppStyles({
  fuseCtaSvgWrap: {
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
