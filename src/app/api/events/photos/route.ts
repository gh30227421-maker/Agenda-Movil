import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const eventId = formData.get('event_id') as string;
    const caption = formData.get('caption') as string;
    const category = formData.get('category') as string || 'General';

    if (!file || !eventId) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios: file, event_id' },
        { status: 400 }
      );
    }

    // Subir a Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${eventId}/${crypto.randomUUID()}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('event_photos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading file to storage:', uploadError);
      return NextResponse.json({ error: 'Error al subir la imagen' }, { status: 500 });
    }

    // Obtener la URL pública
    const { data: publicUrlData } = supabase.storage
      .from('event_photos')
      .getPublicUrl(fileName);

    const publicUrl = publicUrlData.publicUrl;

    // Guardar metadatos en la tabla event_photos
    const { data: dbData, error: dbError } = await supabase
      .from('event_photos')
      .insert({
        event_id: eventId,
        photo_url: publicUrl,
        caption: caption || null,
        category: category,
      } as any)
      .select()
      .single();

    if (dbError) {
      console.error('Error insertando metadatos en BD:', dbError);
      return NextResponse.json({ error: 'Error al guardar metadatos de la imagen' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: dbData });
  } catch (error: any) {
    console.error('Excepción en POST /api/events/photos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('event_id');

  try {
    let query = supabase.from('event_photos').select('*').order('created_at', { ascending: false });

    if (eventId) {
      query = query.eq('event_id', eventId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: 'Error al obtener fotos' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const photoId = searchParams.get('id');

  if (!photoId) {
    return NextResponse.json({ error: 'ID de foto requerido' }, { status: 400 });
  }

  try {
    // Primero, obtener la URL para poder extraer la ruta del storage
    const { data: photo, error: fetchError } = await supabase
      .from('event_photos')
      .select('photo_url')
      .eq('id', photoId)
      .single();

    if (fetchError || !photo) {
      return NextResponse.json({ error: 'Foto no encontrada' }, { status: 404 });
    }

    // Extraer ruta del storage desde la URL pública
    // Formato URL: .../storage/v1/object/public/event_photos/{event_id}/{uuid}.{ext}
    const urlParts = (photo as any).photo_url.split('/event_photos/');
    if (urlParts.length > 1) {
      const storagePath = urlParts[1];
      const { error: storageError } = await supabase.storage.from('event_photos').remove([storagePath]);
      if (storageError) console.error('Error borrando de storage:', storageError);
    }

    // Borrar de la base de datos
    const { error: dbError } = await supabase.from('event_photos').delete().eq('id', photoId);

    if (dbError) {
      return NextResponse.json({ error: 'Error al eliminar metadatos' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
