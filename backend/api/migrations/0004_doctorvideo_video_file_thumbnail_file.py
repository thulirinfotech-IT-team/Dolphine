from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0003_create_admin_user'),
    ]

    operations = [
        migrations.AddField(
            model_name='doctorvideo',
            name='video_file',
            field=models.FileField(blank=True, null=True, upload_to='videos/', help_text='Upload local video file'),
        ),
        migrations.AddField(
            model_name='doctorvideo',
            name='thumbnail_file',
            field=models.ImageField(blank=True, null=True, upload_to='thumbnails/', help_text='Upload thumbnail image'),
        ),
        migrations.AlterField(
            model_name='doctorvideo',
            name='video_url',
            field=models.CharField(blank=True, max_length=500, help_text='YouTube URL or leave blank to upload file'),
        ),
    ]
