from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0004_doctorvideo_video_file_thumbnail_file'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='doctorvideo',
            name='video_file',
        ),
        migrations.RemoveField(
            model_name='doctorvideo',
            name='thumbnail_file',
        ),
        migrations.AlterField(
            model_name='doctorvideo',
            name='video_url',
            field=models.CharField(max_length=500),
        ),
    ]
