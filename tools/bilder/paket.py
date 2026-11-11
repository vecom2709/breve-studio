# Studio Breve – schwebendes, leuchtendes Goldpaket über einer Platine, dreht sich als nahtlose Schleife
# (quadratische Grundfläche + Klebeband-Kreuz: nach 90° sieht es identisch aus -> Schleife ohne Sprung)
# Aufruf: blender -b --factory-startup -P paket.py -- <ausgabeordner> <breite> <hoehe> <samples> <bilder>
import bpy, bmesh, math, os, random, sys
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:]
AUS, RX, RY, SAMPLES, N = argv[0], int(argv[1]), int(argv[2]), int(argv[3]), int(argv[4])
for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)
sc = bpy.context.scene
random.seed(7)


def mat(name, farbe, rau=0.5, metall=0.0, emi=None, staerke=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*farbe, 1); b.inputs['Roughness'].default_value = rau; b.inputs['Metallic'].default_value = metall
    if emi:
        b.inputs['Emission Color'].default_value = (*emi, 1); b.inputs['Emission Strength'].default_value = staerke
    return m, b


def quader(name, sx, sy, sz, loc, m, fase=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.active_object; o.name = name; o.scale = (sx, sy, sz); bpy.ops.object.transform_apply(scale=True)
    if fase:
        f = o.modifiers.new('Fase', 'BEVEL'); f.width = fase; f.segments = 3
    o.data.materials.append(m)
    return o

# ---------- Paket ----------
karton, kb = mat('Karton Gold', (0.70, 0.44, 0.15), 0.45, 0.25)
nt = karton.node_tree
rs = nt.nodes.new('ShaderNodeTexNoise'); rs.inputs['Scale'].default_value = 90; rs.inputs['Detail'].default_value = 6
bu = nt.nodes.new('ShaderNodeBump'); bu.inputs['Strength'].default_value = 0.08
nt.links.new(rs.outputs['Fac'], bu.inputs['Height']); nt.links.new(bu.outputs['Normal'], kb.inputs['Normal'])
band, _ = mat('Klebeband', (0.62, 0.43, 0.20), 0.25, 0.3)
naht, _ = mat('Leuchtnaht', (1, 0.8, 0.4), 0.3, 0.0, (1.0, 0.72, 0.30), 9.0)

S, HZ = 0.30, 0.22
paket = bpy.data.objects.new('Paket', None); sc.collection.objects.link(paket)
teile = [quader('Karton', S, S, HZ, (0, 0, 0), karton, 0.004)]
teile.append(quader('Band X', S + 0.002, 0.055, 0.003, (0, 0, HZ / 2 + 0.001), band))
teile.append(quader('Band Y', 0.055, S + 0.002, 0.003, (0, 0, HZ / 2 + 0.0012), band))
for sgn in (-1, 1):   # Band läuft die Seiten hinunter (auf allen vier Seiten -> symmetrisch)
    teile.append(quader('Band SX', 0.003, 0.055, HZ * 0.35, (sgn * (S / 2 + 0.001), 0, HZ / 2 - HZ * 0.175), band))
    teile.append(quader('Band SY', 0.055, 0.003, HZ * 0.35, (0, sgn * (S / 2 + 0.001), HZ / 2 - HZ * 0.175), band))
bpy.ops.mesh.primitive_cube_add(size=1); dr = bpy.context.active_object; dr.name = 'Nähte'; dr.scale = (S + 0.003, S + 0.003, HZ + 0.003)
bpy.ops.object.transform_apply(scale=True)
w = dr.modifiers.new('Draht', 'WIREFRAME'); w.thickness = 0.0035; w.use_even_offset = True
dr.data.materials.append(naht); teile.append(dr)
for t in teile:
    t.parent = paket

# ---------- Platine ----------
grund, gb = mat('Platine', (0.006, 0.035, 0.042), 0.32, 0.4)
bahn, _ = mat('Leiterbahn', (0.1, 0.5, 0.55), 0.3, 0.6, (0.15, 0.85, 0.95), 1.3)
bahn_matt, _ = mat('Leiterbahn matt', (0.05, 0.25, 0.28), 0.35, 0.8, (0.1, 0.6, 0.7), 0.2)
chip, _ = mat('Chip', (0.012, 0.015, 0.018), 0.4, 0.2)
pad, _ = mat('Lichtfeld', (0.3, 0.8, 0.9), 0.3, 0.0, (0.2, 0.9, 1.0), 6.0)
bpy.ops.mesh.primitive_plane_add(size=4, location=(0, 0, 0)); bpy.context.active_object.data.materials.append(grund)

me = bpy.data.meshes.new('Bahnen'); bm = bmesh.new()
def strich(x0, y0, x1, y1, b=0.0045):
    dx, dy = x1 - x0, y1 - y0; L = math.hypot(dx, dy) or 1e-6; nx, ny = -dy / L * b / 2, dx / L * b / 2
    vs = [bm.verts.new((x0 + nx, y0 + ny, 0.0008)), bm.verts.new((x1 + nx, y1 + ny, 0.0008)),
          bm.verts.new((x1 - nx, y1 - ny, 0.0008)), bm.verts.new((x0 - nx, y0 - ny, 0.0008))]
    bm.faces.new(vs)
for k in range(140):
    a = random.choice([0, 90, 180, 270]); x, y = random.uniform(-1.6, 1.6), random.uniform(-0.9, 0.9)
    if abs(x) < 0.28 and abs(y) < 0.28:
        continue
    for _ in range(random.randint(2, 4)):
        L = random.uniform(0.06, 0.35); r = math.radians(a)
        x2, y2 = x + math.cos(r) * L, y + math.sin(r) * L
        strich(x, y, x2, y2); x, y = x2, y2
        a = (a + random.choice([45, -45, 90, -90, 0])) % 360
bm.to_mesh(me); bm.free()
ob = bpy.data.objects.new('Bahnen', me); sc.collection.objects.link(ob)
ob.data.materials.append(bahn); ob.data.materials.append(bahn_matt)
for i, p in enumerate(ob.data.polygons):
    p.material_index = 0 if i % 3 == 0 else 1
for k in range(16):
    x, y = random.uniform(-1.5, 1.5), random.uniform(-0.8, 0.8)
    if abs(x) < 0.35 and abs(y) < 0.35:
        continue
    quader(f'Chip{k}', random.uniform(0.06, 0.16), random.uniform(0.05, 0.12), 0.012, (x, y, 0.006), chip, 0.0015)
# leuchtender Rahmen unter dem Paket
for sx, sy, lx, ly in ((0.42, 0.008, 0, 0.21), (0.42, 0.008, 0, -0.21), (0.008, 0.42, 0.21, 0), (0.008, 0.42, -0.21, 0)):
    quader('Feld', sx, sy, 0.003, (lx, ly, 0.0015), pad)

# ---------- Animation: 90° Drehung + leichtes Schweben ----------
sc.frame_start, sc.frame_end = 1, N; sc.render.fps = 24
for f in range(1, N + 1):
    t = (f - 1) / N
    paket.rotation_euler = (0, 0, math.radians(18) + t * math.pi / 2)
    paket.location = (0, 0, 0.16 + 0.012 * math.sin(2 * math.pi * t))
    paket.keyframe_insert('rotation_euler', frame=f); paket.keyframe_insert('location', frame=f)

# ---------- Licht, Welt, Kamera ----------
welt = bpy.data.worlds.new('W'); sc.world = welt; welt.use_nodes = True
wn = welt.node_tree; wn.nodes.clear(); bg = wn.nodes.new('ShaderNodeBackground'); bg.inputs['Color'].default_value = (0.006, 0.03, 0.036, 1)
bg.inputs['Strength'].default_value = 1.0; out = wn.nodes.new('ShaderNodeOutputWorld'); wn.links.new(bg.outputs[0], out.inputs[0])
def licht(name, loc, gr, w, farbe, ziel=(0, 0, 0.16)):
    l = bpy.data.lights.new(name, 'AREA'); l.size = gr; l.energy = w; l.color = farbe
    o = bpy.data.objects.new(name, l); sc.collection.objects.link(o); o.location = loc
    o.rotation_euler = (Vector(ziel) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler(); o.visible_camera = False
licht('Front warm', (-0.4, -1.2, 0.9), 0.8, 26, (1.0, 0.85, 0.65))
licht('Kante kühl', (0.9, 0.6, 0.5), 0.6, 25, (0.4, 0.9, 1.0))
licht('Oben', (0, 0, 1.4), 1.0, 18, (1, 0.95, 0.9))
pl = bpy.data.lights.new('Glut', 'POINT'); pl.energy = 6; pl.color = (1.0, 0.7, 0.3); pl.shadow_soft_size = 0.2
po = bpy.data.objects.new('Glut', pl); sc.collection.objects.link(po); po.location = (0, 0, 0.05)

cd = bpy.data.cameras.new('K'); cd.lens = 50; cd.sensor_width = 36
cd.dof.use_dof = True; cd.dof.aperture_fstop = 2.4; cd.dof.focus_distance = 2.25
cam = bpy.data.objects.new('K', cd); sc.collection.objects.link(cam); sc.camera = cam
cam.location = (0, -2.15, 0.78); cam.rotation_euler = (Vector((0, 0, 0.14)) - cam.location).to_track_quat('-Z', 'Y').to_euler()

sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = SAMPLES
sc.cycles.use_adaptive_sampling = True; sc.cycles.use_denoising = True
sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = RX, RY, 100
sc.render.image_settings.file_format = 'PNG'
try:
    sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Medium High Contrast'
except TypeError:
    pass
if os.environ.get('NUR_PROBE'):
    sc.frame_set(1); sc.render.filepath = os.path.join(AUS, 'probe.png'); bpy.ops.render.render(write_still=True)
else:
    sc.render.filepath = os.path.join(AUS, 'pk_'); bpy.ops.render.render(animation=True)
print('FERTIG')
