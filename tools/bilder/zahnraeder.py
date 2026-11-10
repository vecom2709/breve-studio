# Studio Breve – drei ineinandergreifende Zahnräder als nahtlose Schleife (Blender 5.2, Cycles, Hintergrundlauf)
# Jedes Rad dreht sich in der Schleife um genau eine Zahnteilung -> erstes und letztes Bild schließen lückenlos.
# Aufruf: blender -b --factory-startup -P zahnraeder.py -- <ausgabeordner> <breite> <hoehe> <samples> <bilder>
import bpy, bmesh, math, sys, os
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:]
AUS, RX, RY, SAMPLES, N = argv[0], int(argv[1]), int(argv[2]), int(argv[3]), int(argv[4])
for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)
sc = bpy.context.scene

M = 0.04  # Modul (m): Zahngröße


def zahnrad(name, zaehne, dicke, loch, speichen):
    r = M * zaehne / 2; ra = r + M; rf = r - 1.25 * M; p = 2 * math.pi / zaehne
    pts = []
    for k in range(zaehne):
        a = k * p
        for f, rad in ((-0.5, rf), (-0.30, rf), (-0.20, r), (-0.13, ra), (0.13, ra), (0.20, r), (0.30, rf)):
            pts.append((rad * math.cos(a + f * p), rad * math.sin(a + f * p)))
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    vs = [bm.verts.new((x, y, dicke / 2)) for x, y in pts]
    f = bm.faces.new(vs)
    ex = bmesh.ops.extrude_face_region(bm, geom=[f])
    for v in [g for g in ex['geom'] if isinstance(g, bmesh.types.BMVert)]:
        v.co.z -= dicke
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me); sc.collection.objects.link(ob)
    def schneide(form):
        m = ob.modifiers.new('Ausschnitt', 'BOOLEAN'); m.object = form; m.operation = 'DIFFERENCE'; m.solver = 'EXACT'
        form.hide_render = True; form.hide_viewport = True
    bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=loch, depth=dicke * 3); schneide(bpy.context.active_object)
    if speichen:
        ri, ro = loch * 1.9, rf * 0.78
        for s in range(speichen):
            w = 2 * math.pi / speichen; a0 = s * w + w * 0.16; a1 = (s + 1) * w - w * 0.16
            bm2 = bmesh.new(); seg = 14
            ring = [(ro * math.cos(a0 + (a1 - a0) * i / seg), ro * math.sin(a0 + (a1 - a0) * i / seg)) for i in range(seg + 1)]
            ring += [(ri * math.cos(a1 - (a1 - a0) * i / seg), ri * math.sin(a1 - (a1 - a0) * i / seg)) for i in range(seg + 1)]
            v2 = [bm2.verts.new((x, y, dicke * 1.5)) for x, y in ring]; f2 = bm2.faces.new(v2)
            e2 = bmesh.ops.extrude_face_region(bm2, geom=[f2])
            for v in [g for g in e2['geom'] if isinstance(g, bmesh.types.BMVert)]:
                v.co.z -= dicke * 3
            bmesh.ops.recalc_face_normals(bm2, faces=bm2.faces)
            me2 = bpy.data.meshes.new(name + 'S'); bm2.to_mesh(me2); bm2.free()
            o2 = bpy.data.objects.new(name + f'Speiche{s}', me2); sc.collection.objects.link(o2); schneide(o2)
    fa = ob.modifiers.new('Fase', 'BEVEL'); fa.width = 0.0045; fa.segments = 3; fa.limit_method = 'ANGLE'; fa.angle_limit = math.radians(35)
    ob.modifiers.new('Normalen', 'WEIGHTED_NORMAL')
    for pl in ob.data.polygons:
        pl.use_smooth = True
    return ob, zaehne, r

# Material: eloxiertes Aluminium in Petrol/Türkis, feiner Bürststrich
m = bpy.data.materials.new('Eloxal Petrol'); m.use_nodes = True
b = m.node_tree.nodes['Principled BSDF']
b.inputs['Base Color'].default_value = (0.05, 0.36, 0.40, 1); b.inputs['Metallic'].default_value = 1.0
b.inputs['Roughness'].default_value = 0.26; b.inputs['Anisotropic'].default_value = 0.5
b.inputs['Coat Weight'].default_value = 0.4; b.inputs['Coat Roughness'].default_value = 0.08

A, ta, ra_ = zahnrad('Rad A', 24, 0.07, 0.07, 6)
B, tb, rb_ = zahnrad('Rad B', 16, 0.07, 0.05, 5)
C, tc, rc_ = zahnrad('Rad C', 12, 0.07, 0.04, 4)
pa, pb, pc = 2 * math.pi / ta, 2 * math.pi / tb, 2 * math.pi / tc
thB, thC = 2 * pa, 13 * pa  # Eingriffswinkel auf Rad A (Vielfache der Teilung -> Zahn trifft Lücke)
B.location = (math.cos(thB) * (ra_ + rb_), math.sin(thB) * (ra_ + rb_), 0.012)
C.location = (math.cos(thC) * (ra_ + rc_), math.sin(thC) * (ra_ + rc_), -0.012)
offB, offC = thB + math.pi - pb / 2, thC + math.pi - pc / 2
for ob in (A, B, C):
    ob.data.materials.append(m)

sc.frame_start, sc.frame_end = 1, N
sc.render.fps = 24
for f in range(1, N + 1):
    t = (f - 1) / N
    A.rotation_euler = (0, 0, t * pa); A.keyframe_insert('rotation_euler', frame=f)
    B.rotation_euler = (0, 0, offB - t * pb); B.keyframe_insert('rotation_euler', frame=f)
    C.rotation_euler = (0, 0, offC - t * pc); C.keyframe_insert('rotation_euler', frame=f)
for ob in (A, B, C):
    for fc in ob.animation_data.action.fcurves if hasattr(ob.animation_data.action, 'fcurves') else []:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'

gruppe = bpy.data.objects.new('Gruppe', None); sc.collection.objects.link(gruppe)
for ob in (A, B, C):
    ob.parent = gruppe
gruppe.rotation_euler = (math.radians(-28), math.radians(14), math.radians(8)); gruppe.location = (0.05, 0, 0)

# Hintergrund: tiefes Petrol mit weichem Verlauf (Rückwand), dazu Studiolicht
bpy.ops.mesh.primitive_plane_add(size=12, location=(0, 0, -1.1)); wand = bpy.context.active_object
wm = bpy.data.materials.new('Rückwand'); wm.use_nodes = True; wb = wm.node_tree.nodes['Principled BSDF']
wb.inputs['Base Color'].default_value = (0.006, 0.04, 0.05, 1); wb.inputs['Roughness'].default_value = 0.9
wand.data.materials.append(wm)
welt = bpy.data.worlds.new('W'); sc.world = welt; welt.use_nodes = True
wn = welt.node_tree; wn.nodes.clear(); bg = wn.nodes.new('ShaderNodeBackground'); bg.inputs['Color'].default_value = (0.01, 0.05, 0.06, 1)
bg.inputs['Strength'].default_value = 0.12; out = wn.nodes.new('ShaderNodeOutputWorld'); wn.links.new(bg.outputs[0], out.inputs[0])


def licht(name, loc, gr, w, farbe, ziel=(0, 0, 0)):
    l = bpy.data.lights.new(name, 'AREA'); l.size = gr; l.energy = w; l.color = farbe
    o = bpy.data.objects.new(name, l); sc.collection.objects.link(o); o.location = loc
    o.rotation_euler = (Vector(ziel) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler(); o.visible_camera = False

licht('Haupt', (-1.6, 1.2, 2.2), 1.6, 55, (0.85, 0.97, 1.0))
licht('Kante', (1.8, -0.4, 0.6), 0.8, 70, (0.35, 0.95, 0.9))
licht('Gegenlicht', (0.3, 2.0, -0.4), 1.2, 45, (0.55, 0.85, 1.0))
licht('Rückwandglanz', (0.0, 0.2, -0.6), 2.5, 22, (0.2, 0.7, 0.75), ziel=(0, 0, -1.1))

cd = bpy.data.cameras.new('K'); cd.lens = 50; cd.sensor_width = 36
cd.dof.use_dof = True; cd.dof.aperture_fstop = 2.8; cd.dof.focus_distance = 3.0
cam = bpy.data.objects.new('K', cd); sc.collection.objects.link(cam); sc.camera = cam
cam.location = (0.0, -1.25, 2.75); cam.rotation_euler = (Vector((0.05, 0.02, 0)) - cam.location).to_track_quat('-Z', 'Y').to_euler()

sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = SAMPLES
sc.cycles.use_adaptive_sampling = True; sc.cycles.use_denoising = True
sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = RX, RY, 100
sc.render.image_settings.file_format = 'PNG'
try:
    sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Medium High Contrast'
except TypeError:
    pass
sc.render.filepath = os.path.join(AUS, 'zr_')
if os.environ.get('NUR_PROBE'):
    sc.frame_set(1); sc.render.filepath = os.path.join(AUS, 'probe.png'); bpy.ops.render.render(write_still=True)
else:
    bpy.ops.render.render(animation=True)
print('FERTIG')
