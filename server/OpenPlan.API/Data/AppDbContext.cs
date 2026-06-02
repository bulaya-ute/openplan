using Microsoft.EntityFrameworkCore;
using OpenPlan.API.Models;

namespace OpenPlan.API.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<TaskItem> Tasks => Set<TaskItem>();
    public DbSet<Project> Projects => Set<Project>();

    protected override void OnModelCreating(ModelBuilder model)
    {
        model.Entity<User>(e =>
        {
            e.HasKey(u => u.Id);
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.Theme).HasDefaultValue("system");
        });

        model.Entity<TaskItem>(e =>
        {
            e.HasKey(t => t.Id);
            e.Property(t => t.Weight).HasDefaultValue(1.0f);
            e.Property(t => t.Priority).HasConversion<string>();
            e.Property(t => t.Status).HasConversion<string>().HasColumnType("text");
            e.Property(t => t.TaskType).HasConversion<string>();

            e.HasOne(t => t.Owner)
                .WithMany(u => u.Tasks)
                .HasForeignKey(t => t.OwnerId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(t => t.Project)
                .WithMany(p => p.Tasks)
                .HasForeignKey(t => t.ProjectId)
                .OnDelete(DeleteBehavior.SetNull);

            e.HasOne(t => t.Parent)
                .WithMany(t => t.Children)
                .HasForeignKey(t => t.ParentId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        model.Entity<Project>(e =>
        {
            e.HasKey(p => p.Id);
            e.HasOne(p => p.Owner)
                .WithMany(u => u.Projects)
                .HasForeignKey(p => p.OwnerId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
