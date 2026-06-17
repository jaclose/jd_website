# Sanctum Asset Credits

The Sanctum scene uses a mix of lightweight procedural geometry, Canvas-generated leaf/mist/firefly textures, and permissively licensed material maps.

## External Textures

- `public/garden/assets/textures/bark/*`  
  Source: ambientCG Bark012, 1K JPG material. License: CC0 1.0 Public Domain.  
  https://ambientcg.com/view?id=Bark012

- `public/garden/assets/textures/dirt/*`  
  Source: ambientCG Ground020, 1K JPG material. License: CC0 1.0 Public Domain.  
  https://ambientcg.com/view?id=Ground020

## Implementation Notes

- Close trees are optimized scene-native meshes with bark PBR maps, alpha-tested leaf clusters, and shader-driven wind movement.
- Far trees and mountains are lightweight generated backdrops so the Sanctum keeps a reasonable portfolio-page payload.
- Poly Haven CC0 tree models were evaluated as future GLB candidates, but the realistic tree assets are too large to ship directly without a Blender optimization pass.
