import { Text, View } from 'react-native';
import { SlimepediaEntryCard } from '@/src/components/slimepedia/SlimepediaEntryCard';
import type { Species } from '@/src/types';
import type { SlimepediaFusionRecipe } from '@/src/utils/slimepediaFusion';
import { mainScreens } from '@/src/theme/mainScreensTheme';
import { createAppStyles } from '@/src/theme/createAppStyles';

const pedia = mainScreens.slimepedia;

export type SlimepediaFusionRecipeRowProps = {
  recipe: SlimepediaFusionRecipe;
  speciesById: Record<string, Species>;
  discoveredIds: ReadonlySet<string>;
  cellSize: number;
};

function RecipeSlot({
  speciesId,
  speciesById,
  discoveredIds,
  cellSize,
}: {
  speciesId: string;
  speciesById: Record<string, Species>;
  discoveredIds: ReadonlySet<string>;
  cellSize: number;
}) {
  const species = speciesById[speciesId];
  if (!species) {
    return <View style={{ width: cellSize }} />;
  }
  return (
    <SlimepediaEntryCard
      cellSize={cellSize}
      species={species}
      discovered={discoveredIds.has(speciesId)}
      readonly
    />
  );
}

export function SlimepediaFusionRecipeRow({
  recipe,
  speciesById,
  discoveredIds,
  cellSize,
}: SlimepediaFusionRecipeRowProps) {
  return (
    <View style={styles.row}>
      <RecipeSlot
        speciesId={recipe.parentAId}
        speciesById={speciesById}
        discoveredIds={discoveredIds}
        cellSize={cellSize}
      />
      <Text style={styles.operator} accessible={false}>
        +
      </Text>
      <RecipeSlot
        speciesId={recipe.parentBId}
        speciesById={speciesById}
        discoveredIds={discoveredIds}
        cellSize={cellSize}
      />
      <Text style={styles.arrow} accessible={false}>
        →
      </Text>
      <RecipeSlot
        speciesId={recipe.resultId}
        speciesById={speciesById}
        discoveredIds={discoveredIds}
        cellSize={cellSize}
      />
    </View>
  );
}

const styles = createAppStyles({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 2,
  },
  operator: {
    fontSize: 18,
    fontWeight: '900',
    color: pedia.detail.text,
    marginBottom: 18,
    paddingHorizontal: 1,
  },
  arrow: {
    fontSize: 18,
    fontWeight: '900',
    color: pedia.detail.text,
    marginBottom: 18,
    paddingHorizontal: 1,
  },
});
