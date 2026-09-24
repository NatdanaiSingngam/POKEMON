"""Build the trainer board token in Blender and export a browser-ready GLB."""
from pathlib import Path
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
GLB = ROOT / "public" / "models" / "trainer-voxel.glb"
BLEND = ROOT / "assets" / "blender" / "trainer-voxel.blend"
PREVIEW = ROOT / "assets" / "previews" / "trainer-voxel.png"
GLB.parent.mkdir(parents=True, exist_ok=True)
PREVIEW.parent.mkdir(parents=True, exist_ok=True)

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)

colors = {
    "cap_red": (0.78, 0.008, 0.045, 1), "cap_light": (0.92, 0.014, 0.07, 1),
    "cap_dark": (0.48, 0.005, 0.018, 1), "shirt": (0.55, 0.01, 0.025, 1),
    "skin": (0.88, 0.60, 0.46, 1), "skin_light": (1.0, 0.76, 0.60, 1),
    "skin_shadow": (0.68, 0.39, 0.32, 1), "hair": (0.08, 0.065, 0.07, 1),
    "pants": (0.06, 0.32, 0.72, 1), "pants_light": (0.09, 0.42, 0.86, 1),
    "shoe": (0.64, 0.007, 0.022, 1), "white": (0.98, 0.95, 0.89, 1),
    "eye": (0.035, 0.035, 0.04, 1), "belt": (0.14, 0.11, 0.12, 1),
}
materials = {}
for name, rgba in colors.items():
    material = bpy.data.materials.new(name)
    material.diffuse_color = rgba
    material.use_nodes = True
    shader = material.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = rgba
    shader.inputs["Roughness"].default_value = 0.86
    materials[name] = material

model_parts = []
def block(name, loc, size, color):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(materials[color])
    model_parts.append(obj)
    return obj

# In Blender, -Y is the face of the token. GLB maps this toward Three.js +Z.
for side, x in (("Left", -0.16), ("Right", 0.16)):
    block(f"{side}_shoe", (x, -0.035, 0.105), (0.27, 0.36, 0.18), "shoe")
    block(f"{side}_sole", (x, -0.155, 0.055), (0.29, 0.17, 0.09), "white")
    block(f"{side}_leg", (x, 0.015, 0.285), (0.23, 0.27, 0.29), "pants")
    block(f"{side}_knee", (x, -0.14, 0.29), (0.23, 0.04, 0.18), "pants_light")

block("Overalls_hips", (0, 0.015, 0.435), (0.53, 0.32, 0.18), "pants")
block("Red_tunic", (0, 0.03, 0.715), (0.55, 0.34, 0.43), "shirt")
block("Blue_bib", (0, -0.17, 0.61), (0.35, 0.055, 0.22), "pants_light")
block("Belt", (0, -0.185, 0.49), (0.51, 0.05, 0.065), "belt")
block("Pocket", (0, -0.205, 0.645), (0.13, 0.025, 0.10), "pants")
for side, x in (("Left", -0.35), ("Right", 0.35)):
    block(f"{side}_sleeve", (x, 0.025, 0.78), (0.20, 0.32, 0.23), "shirt")
    block(f"{side}_arm", (x, -0.02, 0.56), (0.19, 0.27, 0.27), "skin")
    block(f"{side}_hand", (x, -0.08, 0.425), (0.23, 0.25, 0.15), "skin_light")

block("Neck", (0, 0.015, 0.97), (0.25, 0.25, 0.16), "skin_shadow")
block("Hair_back", (0, 0.15, 1.205), (0.68, 0.36, 0.39), "hair")
block("Face", (0, -0.045, 1.20), (0.64, 0.42, 0.42), "skin")
block("Face_front_light", (0, -0.265, 1.18), (0.47, 0.025, 0.23), "skin_light")
for side, x in (("Left", -0.36), ("Right", 0.36)):
    block(f"{side}_ear", (x, -0.02, 1.17), (0.11, 0.20, 0.20), "skin_light")
    block(f"{side}_hair", (x * 0.87, -0.20, 1.38), (0.13, 0.18, 0.14), "hair")
for side, x in (("Left", -0.125), ("Right", 0.125)):
    block(f"{side}_eye", (x, -0.286, 1.23), (0.09, 0.035, 0.17), "eye")
    block(f"{side}_eye_light", (x - 0.017, -0.307, 1.28), (0.025, 0.012, 0.04), "white")
block("Nose", (0, -0.315, 1.115), (0.16, 0.11, 0.13), "skin_light")
block("Smile", (0, -0.288, 1.055), (0.15, 0.018, 0.025), "skin_shadow")

# Three stepped cap tiers create the oversized voxel silhouette in the reference.
block("Cap_inner", (0, 0.015, 1.465), (0.78, 0.59, 0.22), "cap_red")
block("Cap_middle", (0, 0.04, 1.565), (0.89, 0.66, 0.20), "cap_light")
block("Cap_crown", (0, 0.075, 1.655), (0.72, 0.52, 0.14), "cap_red")
block("Cap_top", (0, 0.085, 1.715), (0.53, 0.39, 0.055), "cap_light")
block("Cap_brim", (0, -0.345, 1.47), (0.99, 0.25, 0.115), "cap_red")
block("Cap_brim_edge", (0, -0.468, 1.433), (0.88, 0.033, 0.06), "cap_dark")
block("Cap_badge", (0, -0.477, 1.535), (0.20, 0.025, 0.105), "white")
block("Cap_badge_mark", (0, -0.493, 1.535), (0.07, 0.014, 0.055), "cap_red")

# Keep the file editable and the runtime export free of preview scenery.
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=str(BLEND))
# Merge blocks by material for fewer draw calls while keeping the .blend source editable.
merged_parts = []
for material in materials.values():
    same = [obj for obj in bpy.data.objects if obj.type == "MESH" and obj.data.materials and obj.data.materials[0] == material]
    if not same:
        continue
    bpy.ops.object.select_all(action="DESELECT")
    for obj in same:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = same[0]
    bpy.ops.object.join()
    same[0].name = f"Trainer_{material.name}"
    merged_parts.append(same[0])
model_parts = merged_parts
bpy.ops.object.select_all(action="DESELECT")
for obj in model_parts:
    obj.select_set(True)
bpy.context.view_layer.objects.active = model_parts[0]
bpy.ops.export_scene.gltf(filepath=str(GLB), export_format="GLB", use_selection=True, export_apply=True)

scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.view_settings.view_transform = "Standard"
scene.view_settings.look = "Medium High Contrast"
scene.cycles.samples = 24
scene.render.resolution_x = 720
scene.render.resolution_y = 840
scene.render.resolution_percentage = 100
scene.world.color = (0.45, 0.025, 0.10)

floor_mat = bpy.data.materials.new("Preview pink floor")
floor_mat.diffuse_color = (0.72, 0.005, 0.075, 1)
floor_mat.use_nodes = True
floor_mat.node_tree.nodes.get("Principled BSDF").inputs["Base Color"].default_value = floor_mat.diffuse_color
block("Preview_floor", (0, 0, -0.045), (200, 200, 0.08), "cap_dark").data.materials.clear()
bpy.context.object.data.materials.append(floor_mat)

bpy.ops.object.camera_add(location=(2.7, -4.0, 2.7))
camera = bpy.context.object
direction = Vector((0, 0, 0.95)) - camera.location
camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
camera.data.type = "ORTHO"; camera.data.ortho_scale = 2.55
scene.camera = camera
for name, loc, power, size in (("Key", (0, -3, 5), 550, 4), ("Fill", (-4, 1, 3), 360, 3)):
    bpy.ops.object.light_add(type="AREA", location=loc)
    light = bpy.context.object; light.name = name; light.data.energy = power; light.data.shape = "DISK"; light.data.size = size
scene.render.filepath = str(PREVIEW)
bpy.ops.render.render(write_still=True)
print(f"TRAINER_EXPORTED {GLB} {GLB.stat().st_size} bytes")
print(f"TRAINER_PREVIEW {PREVIEW}")
