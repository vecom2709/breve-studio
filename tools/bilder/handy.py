# Studio Breve – fotorealistisches Smartphone im Walnuss-Ständer (Blender 5.2, Cycles, Hintergrundlauf)
# Aufruf: blender -b --factory-startup -P handy.py -- <bild> <ausgabe.png> <breite> <hoehe> <samples> [blend-datei]
import bpy, bmesh, math, sys, os
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:]
BILD, AUS, RX, RY, SAMPLES = argv[0], argv[1], int(argv[2]), int(argv[3]), int(argv[4])
BLEND = argv[5] if len(argv) > 5 else None

for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)
sc = bpy.context.scene
sc.unit_settings.system = 'METRIC'; sc.unit_settings.scale_length = 1.0

# ---------- Maße (reales Gerät, Meter) ----------
W, H, D = 0.0715, 0.1470, 0.00825
R = 0.0105            # Eckradius Gehäuse
GLAS_RAND = 0.00025   # Glas sitzt knapp innerhalb des Rahmens
BEZEL = 0.00145       # schwarzer Rand bis zur Anzeige


def rundrechteck(name, w, h, r, z, dicke=0.0, seg=24):
    """Abgerundetes Rechteck in XY, optional als Platte mit Dicke nach unten."""
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    pts = []
    for cx, cy, a0 in ((w/2 - r, h/2 - r, 0), (-w/2 + r, h/2 - r, 90), (-w/2 + r, -h/2 + r, 180), (w/2 - r, -h/2 + r, 270)):
        for i in range(seg + 1):
            a = math.radians(a0 + 90 * i / seg)
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    oben = [bm.verts.new((x, y, z)) for x, y in pts]
    f = bm.faces.new(oben)
    if dicke > 0:
        r_ = bmesh.ops.extrude_face_region(bm, geom=[f])
        for v in [e for e in r_['geom'] if isinstance(e, bmesh.types.BMVert)]:
            v.co.z -= dicke
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    uv = bm.loops.layers.uv.new('UV')
    for face in bm.faces:
        for l in face.loops:
            l[uv].uv = ((l.vert.co.x + w/2) / w, (l.vert.co.y + h/2) / h)
    bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me)
    sc.collection.objects.link(ob)
    return ob


def glatt(ob, fase=0.0, seg=4, winkel=35):
    if fase:
        m = ob.modifiers.new('Fase', 'BEVEL'); m.width = fase; m.segments = seg
        m.limit_method = 'ANGLE'; m.angle_limit = math.radians(winkel); m.harden_normals = True
    ob.modifiers.new('Normalen', 'WEIGHTED_NORMAL').keep_sharp = True
    for p in ob.data.polygons:
        p.use_smooth = True


def mat(name, **k):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    for key, val in k.items():
        b.inputs[key].default_value = val
    return m, b

# ---------- Materialien ----------
titan, tb = mat('Rahmen Graphit-Titan', **{'Base Color': (0.30, 0.31, 0.315, 1), 'Metallic': 1.0, 'Roughness': 0.3, 'Anisotropic': 0.35})
nt = titan.node_tree
rausch = nt.nodes.new('ShaderNodeTexNoise'); rausch.inputs['Scale'].default_value = 2600; rausch.inputs['Detail'].default_value = 2
koord = nt.nodes.new('ShaderNodeTexCoord'); mp = nt.nodes.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (1, 1, 40)
nt.links.new(koord.outputs['Object'], mp.inputs['Vector']); nt.links.new(mp.outputs['Vector'], rausch.inputs['Vector'])
mr = nt.nodes.new('ShaderNodeMapRange'); mr.inputs['To Min'].default_value = 0.26; mr.inputs['To Max'].default_value = 0.36
nt.links.new(rausch.outputs['Fac'], mr.inputs['Value']); nt.links.new(mr.outputs['Result'], tb.inputs['Roughness'])

glas, _ = mat('Deckglas', **{'Base Color': (0.004, 0.0045, 0.005, 1), 'Roughness': 0.035, 'Coat Weight': 1.0, 'Coat Roughness': 0.02, 'IOR': 1.52})
insel, _ = mat('Kamera-Insel', **{'Base Color': (0.001, 0.001, 0.001, 1), 'Roughness': 0.12})
rueck, _ = mat('Rückglas matt', **{'Base Color': (0.10, 0.11, 0.115, 1), 'Roughness': 0.42})

anzeige, ab = mat('Anzeige', **{'Base Color': (0, 0, 0, 1), 'Roughness': 0.05, 'Coat Weight': 1.0, 'Coat Roughness': 0.015})
an = anzeige.node_tree
tex = an.nodes.new('ShaderNodeTexImage'); tex.image = bpy.data.images.load(BILD); tex.interpolation = 'Cubic'; tex.extension = 'EXTEND'
iw, ih = tex.image.size
SW, SH = W - 2 * (GLAS_RAND + BEZEL), H - 2 * (GLAS_RAND + BEZEL)
anteil = (iw / (SW / SH)) / ih          # sichtbarer Anteil der Bildhöhe (oben bündig)
uvn = an.nodes.new('ShaderNodeUVMap'); sep = an.nodes.new('ShaderNodeSeparateXYZ'); com = an.nodes.new('ShaderNodeCombineXYZ')
m1 = an.nodes.new('ShaderNodeMath'); m1.operation = 'MULTIPLY_ADD'; m1.inputs[1].default_value = anteil; m1.inputs[2].default_value = 1 - anteil
an.links.new(uvn.outputs['UV'], sep.inputs['Vector'])
an.links.new(sep.outputs['X'], com.inputs['X']); an.links.new(sep.outputs['Y'], m1.inputs[0]); an.links.new(m1.outputs[0], com.inputs['Y'])
an.links.new(com.outputs['Vector'], tex.inputs['Vector'])
an.links.new(tex.outputs['Color'], ab.inputs['Emission Color'])
ab.inputs['Emission Strength'].default_value = 1.0

holz, hb = mat('Walnuss geölt', **{'Roughness': 0.38, 'Coat Weight': 0.25, 'Coat Roughness': 0.25})
hn = holz.node_tree
hk = hn.nodes.new('ShaderNodeTexCoord'); hm = hn.nodes.new('ShaderNodeMapping'); hm.inputs['Scale'].default_value = (14, 2.2, 2.2)
hw = hn.nodes.new('ShaderNodeTexWave'); hw.wave_type = 'BANDS'; hw.bands_direction = 'X'; hw.inputs['Scale'].default_value = 2.2
hw.inputs['Distortion'].default_value = 13; hw.inputs['Detail'].default_value = 8; hw.inputs['Detail Roughness'].default_value = 0.68
hr = hn.nodes.new('ShaderNodeValToRGB')
hr.color_ramp.elements[0].color = (0.085, 0.045, 0.024, 1); hr.color_ramp.elements[1].color = (0.165, 0.09, 0.048, 1)
hn.links.new(hk.outputs['Object'], hm.inputs['Vector']); hn.links.new(hm.outputs['Vector'], hw.inputs['Vector'])
hn.links.new(hw.outputs['Fac'], hr.inputs['Fac']); hn.links.new(hr.outputs['Color'], hb.inputs['Base Color'])

# ---------- Gerät (flach gebaut: Anzeige zeigt nach +Z, Höhe entlang Y) ----------
teile = []
koerper = rundrechteck('Gehäuse', W, H, R, D / 2, D, 28); glatt(koerper, 0.00115, 6); koerper.data.materials.append(titan); teile.append(koerper)
deck = rundrechteck('Deckglas', W - 2 * GLAS_RAND, H - 2 * GLAS_RAND, R - GLAS_RAND, D / 2 + 0.00055, 0.0006, 28); glatt(deck, 0.00035, 3)
deck.data.materials.append(glas); teile.append(deck)
schirm = rundrechteck('Anzeige', SW, SH, R - GLAS_RAND - BEZEL * 0.8, D / 2 + 0.000565, 0.0, 28); glatt(schirm)
schirm.data.materials.append(anzeige); teile.append(schirm)
pille = rundrechteck('Kamera-Insel', 0.0122, 0.0036, 0.0018, D / 2 + 0.00059, 0.0, 12)
pille.location.y = H / 2 - GLAS_RAND - BEZEL - 0.0062; pille.data.materials.append(insel); glatt(pille); teile.append(pille)
for nm, seite, y, l in (('Ein-Taste', 1, 0.024, 0.017), ('Laut+', -1, 0.032, 0.0105), ('Laut-', -1, 0.018, 0.0105), ('Aktion', -1, 0.046, 0.0065)):
    t = rundrechteck(nm, 0.0016, l, 0.0007, 0.0011, 0.0022, 8)
    t.location = (seite * (W / 2 + 0.0002), y, 0); glatt(t, 0.00025, 2); t.data.materials.append(titan); teile.append(t)

geraet = bpy.data.objects.new('Smartphone', None); sc.collection.objects.link(geraet)
for t in teile:
    t.parent = geraet
NEIGUNG = math.radians(16)
geraet.rotation_euler = (math.radians(90) - NEIGUNG, 0, 0)
BASIS_H = 0.011
geraet.location = (0, -0.017 + (H / 2) * math.sin(NEIGUNG) + (D / 2) * math.cos(NEIGUNG),
                   BASIS_H + (H / 2) * math.cos(NEIGUNG) + 0.0002)

# ---------- Ständer aus Walnuss ----------
def klotz(name, sx, sy, sz, loc, rot=(0, 0, 0), fase=0.0012):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.active_object; o.name = name; o.scale = (sx, sy, sz)
    bpy.ops.object.transform_apply(scale=True)
    glatt(o, fase, 4, 40); o.data.materials.append(holz)
    return o

klotz('Ständer Fuß', 0.088, 0.072, BASIS_H, (0, 0.006, BASIS_H / 2))
klotz('Ständer Lippe', 0.088, 0.0065, 0.008, (0, -0.0235, BASIS_H + 0.004), fase=0.0015)
lehne_h = 0.092
mitte = Vector((0, 0.006 + 0.004 + (lehne_h / 2) * math.sin(NEIGUNG) + 0.004, BASIS_H + (lehne_h / 2) * math.cos(NEIGUNG)))
klotz('Ständer Lehne', 0.064, 0.008, lehne_h, mitte, rot=(-NEIGUNG, 0, 0))

# ---------- Boden als Schattenfänger, Licht, Kamera ----------
bpy.ops.mesh.primitive_plane_add(size=3, location=(0, 0, 0)); boden = bpy.context.active_object; boden.is_shadow_catcher = True

welt = bpy.data.worlds.new('Studio'); sc.world = welt; welt.use_nodes = True
wn = welt.node_tree; wn.nodes.clear()
env = wn.nodes.new('ShaderNodeTexEnvironment')
pfad = os.path.join(os.path.dirname(bpy.app.binary_path), '5.2', 'datafiles', 'studiolights', 'world', 'interior.exr')
if os.path.exists(pfad):
    env.image = bpy.data.images.load(pfad)
bg = wn.nodes.new('ShaderNodeBackground'); bg.inputs['Strength'].default_value = 0.035
out = wn.nodes.new('ShaderNodeOutputWorld')
wn.links.new(env.outputs['Color'], bg.inputs['Color']); wn.links.new(bg.outputs['Background'], out.inputs['Surface'])


def flaechenlicht(name, loc, gr, leistung, farbe, ziel=(0, 0, 0.085), form='RECTANGLE', gy=None):
    l = bpy.data.lights.new(name, 'AREA'); l.shape = form; l.size = gr; l.size_y = gy or gr
    l.energy = leistung; l.color = farbe; l.spread = math.radians(70)
    o = bpy.data.objects.new(name, l); sc.collection.objects.link(o); o.location = loc
    o.rotation_euler = (Vector(ziel) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    o.visible_camera = False
    return o

# Softbox steil von links oben: ihr Spiegelbild fällt NICHT auf die Anzeige (Spiegelrichtung gemessen ~44° entfernt)
flaechenlicht('Hauptlicht Softbox', (-0.55, -0.25, 0.6), 0.55, 4.2, (1.0, 0.96, 0.9))
flaechenlicht('Kante Petrol', (0.42, 0.22, 0.26), 0.25, 1.7, (0.62, 0.96, 0.86), gy=0.7)
flaechenlicht('Kante warm', (-0.36, 0.3, 0.3), 0.2, 0.9, (1.0, 0.82, 0.6), gy=0.6)
flaechenlicht('Oberlicht hinten', (0.0, 0.3, 0.6), 0.6, 1.4, (1, 1, 1))
flaechenlicht('Streiflicht Front', (0.25, -0.6, 0.05), 0.4, 0.5, (1, 0.97, 0.92), gy=0.15)

cam_d = bpy.data.cameras.new('Kamera'); cam_d.lens = 70; cam_d.sensor_width = 36
cam_d.dof.use_dof = True; cam_d.dof.aperture_fstop = 5.6
cam = bpy.data.objects.new('Kamera', cam_d); sc.collection.objects.link(cam); sc.camera = cam
ziel = Vector((0.004, 0.0, 0.084)); dist = 0.40
gier, hoehe = math.radians(27), math.radians(13)
cam.location = ziel + Vector((math.sin(gier) * math.cos(hoehe), -math.cos(gier) * math.cos(hoehe), math.sin(hoehe))) * dist
cam.rotation_euler = (ziel - cam.location).to_track_quat('-Z', 'Y').to_euler()
fokus = bpy.data.objects.new('Fokus', None); sc.collection.objects.link(fokus); fokus.location = (0, -0.004, 0.095)
cam_d.dof.focus_object = fokus

# ---------- Render ----------
sc.render.engine = 'CYCLES'
sc.cycles.device = 'CPU'
sc.cycles.samples = SAMPLES; sc.cycles.use_adaptive_sampling = True; sc.cycles.adaptive_threshold = 0.008
sc.cycles.use_denoising = True
try:
    sc.cycles.denoiser = 'OPENIMAGEDENOISE'
except Exception:
    pass
sc.render.film_transparent = True
sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = RX, RY, 100
sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_mode = 'RGBA'; sc.render.image_settings.color_depth = '16'
for vt in ('Khronos PBR Neutral', 'AgX', 'Standard'):
    try:
        sc.view_settings.view_transform = vt; break
    except TypeError:
        continue
sc.view_settings.exposure = float(os.environ.get('BELICHTUNG', '0'))
print('Ansichtstransformation:', sc.view_settings.view_transform, 'Bild', iw, ih, 'Anteil', round(anteil, 4))
sc.render.filepath = AUS
if BLEND:
    bpy.ops.wm.save_as_mainfile(filepath=BLEND)
bpy.ops.render.render(write_still=True)
print('FERTIG', AUS)
